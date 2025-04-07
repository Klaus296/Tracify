import { StatusBar } from 'expo-status-bar';
import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, Button, Image } from 'react-native';
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';

const FILE_PATH = `${FileSystem.documentDirectory}appData.json`;

export default function App() {
  const [savedHabits, setSavedHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [showHabitSelector, setShowHabitSelector] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('ru');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState(3);
  const [purchases, setPurchases] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const storeItems = [
    { id: '1', name: '2 Lives', cost: 50, lives: 2 },
    { id: '2', name: '4 Lives', cost: 90, lives: 4 },
    { id: '3', name: '6 Lives', cost: 130, lives: 6 },
  ];

  useEffect(() => {
    async function initializeApp() {
      await loadData();
      await configureNotifications();
      await checkNewDay();
    }
    initializeApp();

    const interval = setInterval(() => checkNewDay(), 60000);
    return () => clearInterval(interval);
  }, []);

  const configureNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert(getText('notificationsPermission'));
      return;
    }
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: notificationsEnabled,
        shouldPlaySound: notificationsEnabled,
        shouldSetBadge: false,
      }),
    });
  };

  const scheduleDailyNotification = async () => {
    if (!notificationsEnabled) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getText('habitReminder'),
        body: getText('today'),
      },
      trigger: { hour: 9, minute: 0, repeats: true },
    });
  };

  const checkNewDay = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (today !== currentDate) {
      const penalty = todayHabits.filter(h => h.status === 'pending').length * 15;
      if (penalty > 0) {
        setPoints(prev => Math.max(0, prev - penalty));
      }
      setTodayHabits([]);
      setPurchases([]);
      setCurrentDate(today);
      await scheduleDailyNotification();
      await saveData();
    }
  };

  const saveData = async () => {
    try {
      const data = {
        savedHabits,
        todayHabits,
        points,
        lives,
        purchases,
        theme,
        language,
        notificationsEnabled,
      };
      console.log('Saving data:', JSON.stringify(data));
      await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(data));
      console.log('Data saved successfully at:', FILE_PATH);
    } catch (error) {
      console.error('Failed to save data:', error);
      alert('Ошибка сохранения данных: ' + error.message);
    }
  };

  const loadData = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(FILE_PATH);
      console.log('Checking file at:', FILE_PATH, 'Exists:', fileInfo.exists);
      if (fileInfo.exists) {
        const data = await FileSystem.readAsStringAsync(FILE_PATH);
        const parsedData = JSON.parse(data);
        setSavedHabits(parsedData.savedHabits || []);
        setTodayHabits(parsedData.todayHabits || []);
        setPoints(parsedData.points || 0);
        setLives(parsedData.lives || 3);
        setPurchases(parsedData.purchases || []);
        setTheme(parsedData.theme || 'light');
        setLanguage(parsedData.language || 'ru');
        setNotificationsEnabled(parsedData.notificationsEnabled !== false);
        console.log('Data loaded:', parsedData);
      } else {
        setPoints(0);
        setLives(3);
        setTheme('light');
        setLanguage('ru');
        setNotificationsEnabled(true);
        await saveData();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Ошибка загрузки данных: ' + error.message);
    }
  };

  const addNewHabit = async (saveToSaved = false) => {
    if (newHabit.trim() === '') return;

    const habitObj = {
      id: Date.now().toString(),
      title: newHabit,
      status: 'pending',
      isSaved: saveToSaved,
      createdDate: new Date().toISOString().split('T')[0],
    };

    // Сначала обновляем все состояния, затем сохраняем
    let newSavedHabits = savedHabits;
    let newTodayHabits = todayHabits;

    if (saveToSaved) {
      newSavedHabits = [...savedHabits, habitObj];
      setSavedHabits(newSavedHabits);
    }
    newTodayHabits = [...todayHabits, { ...habitObj, id: `${habitObj.id}-${currentDate}` }];
    setTodayHabits(newTodayHabits);
    setNewHabit('');
    setShowHabitSelector(false);

    // Сохраняем после всех изменений
    try {
      const data = {
        savedHabits: newSavedHabits,
        todayHabits: newTodayHabits,
        points,
        lives,
        purchases,
        theme,
        language,
        notificationsEnabled,
      };
      console.log('Saving new habit:', JSON.stringify(data));
      await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(data));
      console.log('Habit saved successfully at:', FILE_PATH);
    } catch (error) {
      console.error('Failed to save new habit:', error);
      alert('Ошибка сохранения новой привычки: ' + error.message);
    }
  };

  const addSavedHabitToToday = async (habit) => {
    const todayHabitId = `${habit.id}-${currentDate}`;
    if (!todayHabits.some(h => h.id === todayHabitId)) {
      const newTodayHabits = [...todayHabits, { ...habit, id: todayHabitId, status: 'pending' }];
      setTodayHabits(newTodayHabits);
      await saveData();
    }
    setShowHabitSelector(false);
  };

  const toggleHabitStatus = async (id) => {
    const updatedHabits = todayHabits.map(habit =>
      habit.id === id
        ? { ...habit, status: habit.status === 'done' ? 'pending' : 'done' }
        : habit
    );
    setTodayHabits(updatedHabits);
    setPoints(prev => {
      const habit = todayHabits.find(h => h.id === id);
      return habit.status === 'done' ? prev - 5 : prev + 5;
    });
    await saveData();
  };

  const deleteTodayHabit = async (id) => {
    setTodayHabits(prev => prev.filter(habit => habit.id !== id));
    await saveData();
  };

  const deleteSavedHabit = async (id) => {
    setSavedHabits(prev => prev.filter(habit => habit.id !== id));
    setTodayHabits(prev => prev.filter(habit => habit.id.split('-')[0] !== id));
    await saveData();
  };

  const buyItem = async (item) => {
    if (points >= item.cost) {
      setPoints(prev => prev - item.cost);
      setPurchases(prev => [...prev, item.id]);
      setLives(prev => prev + item.lives);
      await saveData();
    }
  };

  const renderTodayHabit = ({ item }) => (
    <View
      style={[
        styles.habitItem,
        {
          backgroundColor:
            item.status === 'done'
              ? '#00FF00'
              : theme === 'light'
              ? '#fff'
              : '#333',
        },
      ]}
    >
      <TouchableOpacity
        style={styles.habitTextContainer}
        onPress={() => toggleHabitStatus(item.id)}
      >
        <Text
          style={{
            color: item.status === 'done' ? '#000' : theme === 'light' ? '#000' : '#fff',
          }}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodayHabit(item.id)}
      >
        <AntDesign name="delete" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  const renderSavedHabit = ({ item }) => (
    <View style={[styles.habitItem, { backgroundColor: theme === 'light' ? '#fff' : '#333' }]}>
      <TouchableOpacity
        style={styles.habitTextContainer}
        onPress={() => addSavedHabitToToday(item)}
      >
        <Text style={{ color: theme === 'light' ? '#000' : '#fff' }}>{item.title}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteSavedHabit(item.id)}
      >
        <AntDesign name="delete" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  const renderStoreItem = ({ item }) => (
    <View style={styles.storeItem}>
      <Text style={themeStyles.text}>{item.name} - {item.cost} {getText('points')}</Text>
      <TouchableOpacity
        style={[styles.buyButton, purchases.includes(item.id) && styles.purchasedButton]}
        onPress={() => buyItem(item)}
        disabled={points < item.cost}
      >
        <Text style={styles.buyButtonText}>{getText('buy')}</Text>
      </TouchableOpacity>
    </View>
  );

  const themeStyles = theme === 'light' ? lightTheme : darkTheme;

  const translations = {
    ru: {
      today: 'Сегодня',
      habits: 'Привычки',
      add: '+',
      newHabit: 'Новая привычка',
      saveToSaved: 'Сохранить в ежедневные',
      selectHabit: 'Выбрать привычку',
      close: 'Закрыть',
      settings: 'Настройки',
      store: 'Магазин',
      theme: 'Тема',
      language: 'Язык',
      notificationsEnabled: 'Уведомления',
      lightTheme: 'Светлая',
      darkTheme: 'Темная',
      russian: 'Русский',
      english: 'English',
      spanish: 'Español',
      points: 'Баллы',
      lives: 'Жизни',
      buy: 'Купить',
      purchased: 'Куплено',
      habitReminder: 'Напоминание о привычках',
      notificationsPermission: 'Разрешение на уведомления не получено!',
    },
    en: {
      today: 'Today',
      habits: 'Habits',
      add: '+',
      newHabit: 'New Habit',
      saveToSaved: 'Save to daily',
      selectHabit: 'Select Habit',
      close: 'Close',
      settings: 'Settings',
      store: 'Store',
      theme: 'Theme',
      language: 'Language',
      notificationsEnabled: 'Notifications',
      lightTheme: 'Light',
      darkTheme: 'Dark',
      russian: 'Русский',
      english: 'English',
      spanish: 'Español',
      points: 'Points',
      lives: 'Lives',
      buy: 'Buy',
      purchased: 'Purchased',
      habitReminder: 'Habit Reminder',
      notificationsPermission: 'Notifications permission not granted!',
    },
    es: {
      today: 'Hoy',
      habits: 'Hábitos',
      add: '+',
      newHabit: 'Nuevo Hábito',
      saveToSaved: 'Guardar en diarios',
      selectHabit: 'Seleccionar Hábito',
      close: 'Cerrar',
      settings: 'Configuración',
      store: 'Tienda',
      theme: 'Тema',
      language: 'Idioma',
      notificationsEnabled: 'Notificaciones',
      lightTheme: 'Claro',
      darkTheme: 'Oscuro',
      russian: 'Русский',
      english: 'English',
      spanish: 'Español',
      points: 'Puntos',
      lives: 'Vidas',
      buy: 'Comprar',
      purchased: 'Comprado',
      habitReminder: 'Recordatorio de Hábito',
      notificationsPermission: '¡Permiso de notificaciones no concedido!',
    },
  };

  const getText = (key) => translations[language][key];

  return (
    <View style={[styles.container, themeStyles.container]}>
      <View style={[styles.header, themeStyles.header]}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <AntDesign name="menu-fold" size={24} color={themeStyles.iconColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image
            source={require('./assets/icon.png')}
            style={styles.appIcon}
          />
          <View style={styles.pointsContainer}>
            <AntDesign name="star" size={20} color="#FFD700" />
            <Text style={[styles.headerText, themeStyles.title]}>{points}</Text>
          </View>
          <View style={styles.livesContainer}>
            <AntDesign name="heart" size={20} color="#FF4444" />
            <Text style={[styles.headerText, themeStyles.title]}>{lives}</Text>
          </View>
          <Text style={[styles.headerText, themeStyles.title]}>
            {getText('today')}: {daysOfWeek[new Date().getDay()]}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.sectionTitle, themeStyles.text]}>{getText('today')}</Text>
      <FlatList
        data={todayHabits}
        renderItem={renderTodayHabit}
        keyExtractor={item => item.id}
        style={styles.list}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, themeStyles.input]}
          value={newHabit}
          onChangeText={setNewHabit}
          placeholder={getText('newHabit')}
          placeholderTextColor={themeStyles.placeholderColor}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowHabitSelector(true)}
        >
          <Text style={styles.addButtonText}>{getText('add')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuVisible} animationType="slide" transparent={true}>
        <View style={[styles.menuContainer, themeStyles.menuContainer]}>
          <TouchableOpacity
            style={styles.menuClose}
            onPress={() => setMenuVisible(false)}
          >
            <AntDesign name="close" size={24} color={themeStyles.menuIconColor} />
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, themeStyles.menuText]}>{getText('habits')}</Text>
          <FlatList
            data={savedHabits}
            renderItem={renderSavedHabit}
            keyExtractor={item => item.id}
            style={styles.list}
          />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowSettings(true); setMenuVisible(false); }}
          >
            <Text style={[styles.menuText, themeStyles.menuText]}>{getText('settings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowStore(true); setMenuVisible(false); }}
          >
            <Text style={[styles.menuText, themeStyles.menuText]}>{getText('store')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showHabitSelector} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, themeStyles.modalContainer]}>
            <Text style={[styles.modalTitle, themeStyles.modalTitle]}>{getText('selectHabit')}</Text>
            <FlatList
              data={savedHabits}
              renderItem={renderSavedHabit}
              keyExtractor={item => item.id}
              style={styles.list}
            />
            <View style={styles.modalButtonsVertical}>
              <Button title={getText('add')} onPress={() => addNewHabit(false)} />
              <Button title={getText('saveToSaved')} onPress={() => addNewHabit(true)} />
              <Button title={getText('close')} onPress={() => setShowHabitSelector(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettings} transparent={true}>
        <View style={[styles.modalOverlay, themeStyles.modalContainer]}>
          <Text style={[styles.modalTitle, themeStyles.modalTitle]}>{getText('settings')}</Text>
          <View style={styles.settingsOption}>
            <Text style={themeStyles.text}>{getText('theme')}</Text>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={async () => {
                setTheme(theme === 'light' ? 'dark' : 'light');
                await saveData();
              }}
            >
              <Text style={themeStyles.text}>
                {theme === 'light' ? getText('darkTheme') : getText('lightTheme')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.settingsOption}>
            <Text style={themeStyles.text}>{getText('language')}</Text>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={() => setShowLanguageModal(true)}
            >
              <Text style={themeStyles.text}>
                {language === 'ru' ? 'Русский' : language === 'en' ? 'English' : 'Español'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.settingsOption}>
            <Text style={themeStyles.text}>{getText('notificationsEnabled')}</Text>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={async () => {
                const newValue = !notificationsEnabled;
                setNotificationsEnabled(newValue);
                await saveData();
                if (!newValue) {
                  await Notifications.cancelAllScheduledNotificationsAsync();
                } else {
                  await scheduleDailyNotification();
                }
              }}
            >
              <Text style={themeStyles.text}>
                {notificationsEnabled ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
          <Button title={getText('close')} onPress={() => setShowSettings(false)} />
        </View>
      </Modal>

      <Modal visible={showLanguageModal} transparent={true}>
        <View style={[styles.modalOverlay, themeStyles.modalContainer]}>
          <Text style={[styles.modalTitle, themeStyles.modalTitle]}>{getText('language')}</Text>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={async () => {
              setLanguage('ru');
              setShowLanguageModal(false);
              await saveData();
            }}
          >
            <Text style={themeStyles.text}>Русский</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={async () => {
              setLanguage('en');
              setShowLanguageModal(false);
              await saveData();
            }}
          >
            <Text style={themeStyles.text}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageOption}
            onPress={async () => {
              setLanguage('es');
              setShowLanguageModal(false);
              await saveData();
            }}
          >
            <Text style={themeStyles.text}>Español</Text>
          </TouchableOpacity>
          <Button title={getText('close')} onPress={() => setShowLanguageModal(false)} />
        </View>
      </Modal>

      <Modal visible={showStore} transparent={true}>
        <View style={[styles.modalOverlay, themeStyles.modalContainer]}>
          <Text style={[styles.modalTitle, themeStyles.modalTitle]}>{getText('store')}</Text>
          <FlatList
            data={storeItems}
            renderItem={renderStoreItem}
            keyExtractor={item => item.id}
            style={styles.storeList}
          />
          <Button title={getText('close')} onPress={() => setShowStore(false)} />
        </View>
      </Modal>

      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
    </View>
  );
}

const lightTheme = StyleSheet.create({
  container: { backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff' },
  title: { color: '#000' },
  sectionTitle: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  iconColor: '#000',
  input: { borderColor: '#ddd', color: '#000' },
  placeholderColor: '#999',
  menuContainer: { backgroundColor: '#fff' },
  menuIconColor: '#000',
  menuText: { color: '#000' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { color: '#000' },
  text: { color: '#000' },
});

const darkTheme = StyleSheet.create({
  container: { backgroundColor: '#1a1a1a' },
  header: { backgroundColor: '#2a2a2a' },
  title: { color: '#fff' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  iconColor: '#fff',
  input: { borderColor: '#444', color: '#fff' },
  placeholderColor: '#888',
  menuContainer: { backgroundColor: '#333' },
  menuIconColor: '#fff',
  menuText: { color: '#fff' },
  modalContainer: { backgroundColor: '#333', borderRadius: 10, padding: 20 },
  modalTitle: { color: '#fff' },
  text: { color: '#fff' },
});

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pointsContainer: { flexDirection: 'row', alignItems: 'center' },
  livesContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  headerText: { fontSize: 18, marginLeft: 5 },
  appIcon: { width: 32, height: 32, marginRight: 10 },
  sectionTitle: { paddingHorizontal: 20, marginBottom: 10 },
  inputContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  input: { flex: 1, borderWidth: 1, borderRadius: 5, padding: 10, marginRight: 10 },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 24 },
  list: { paddingHorizontal: 20 },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  habitTextContainer: { flex: 1 },
  deleteButton: { padding: 5 },
  menuContainer: { flex: 1, width: '70%', paddingTop: 50 },
  menuClose: { position: 'absolute', top: 10, right: 10 },
  menuItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#444' },
  menuText: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.8)',
  },
  modalContainer: { width: '80%', maxHeight: '80%', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalButtonsVertical: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 20,
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 10,
  },
  themeButton: { padding: 10, backgroundColor: '#007AFF', borderRadius: 5 },
  languageOption: { padding: 10, width: '100%', alignItems: 'center' },
  storeList: { width: '100%' },
  storeItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  buyButton: { padding: 5, backgroundColor: '#007AFF', borderRadius: 5, marginTop: 5 },
  purchasedButton: { backgroundColor: '#666' },
  buyButtonText: { color: '#fff', textAlign: 'center' },
});