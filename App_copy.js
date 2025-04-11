import { StatusBar } from 'expo-status-bar';
import AntDesign from '@expo/vector-icons/AntDesign';
import {StyleSheet,Text,View,FlatList,TouchableOpacity,TextInput,Modal,Button,Image,Alert,BackHandler} from 'react-native';
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';

const FILE_PATH = `${FileSystem.documentDirectory}appData.json`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [savedHabits, setSavedHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showHabitSelector, setShowHabitSelector] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('ru');
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState(3);
  const [purchases, setPurchases] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [completedToday, setCompletedToday] = useState(0);
  const [streaks, setStreaks] = useState({}); 

  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const storeItems = [
    { id: '1', name: '2 Lives', cost: 50, lives: 2 },
    { id: '2', name: '4 Lives', cost: 90, lives: 4 },
    { id: '3', name: '6 Lives', cost: 130, lives: 6 },
  ];

  const streakRewards = {
    3: 10, // 10 points for 3-day streak
    5: 20, // 20 points for 5-day streak
    10: 50, // 50 points for 10-day streak
  };

  useEffect(() => {
    async function initializeApp() {
      await loadData();
      await checkNewDay();
      await requestNotificationPermissions();
      await scheduleDailyReminder();
    }
    initializeApp();

    const interval = setInterval(() => checkNewDay(), 60000);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        getText('exitTitle'),
        getText('exitMessage'),
        [
          { text: getText('cancel'), style: 'cancel' },
          {
            text: getText('exit'),
            onPress: async () => {
              await saveData();
              BackHandler.exitApp();
            },
          },
        ],
        { cancelable: false }
      );
      return true;
    });

    return () => {
      clearInterval(interval);
      backHandler.remove();
    };
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        getText('notificationPermissionTitle'),
        getText('notificationPermissionMessage')
      );
    }
  };

  const scheduleDailyReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const trigger = {
      hour: 20, // 8 PM
      minute: 0,
      repeats: true,
    };
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getText('reminderTitle'),
        body: getText('reminderBody'),
      },
      trigger,
    });
  };

  const checkNewDay = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (today !== currentDate) {
      const penalty = todayHabits.filter(h => h.status === 'pending').length * 15;
      if (penalty > 0) {
        setPoints(prev => Math.max(0, prev - penalty));
      }
      // Update streaks
      const newStreaks = { ...streaks };
      savedHabits.forEach(habit => {
        const wasCompletedToday = todayHabits.some(
          h => h.id.split('-')[0] === habit.id && h.status === 'completed'
        );
        if (wasCompletedToday) {
          newStreaks[habit.id] = (newStreaks[habit.id] || 0) + 1;
          // Award streak bonuses
          if (streakRewards[newStreaks[habit.id]]) {
            setPoints(prev => prev + streakRewards[newStreaks[habit.id]]);
            Alert.alert(
              getText('streakRewardTitle'),
              `${getText('streakRewardMessage')} ${newStreaks[habit.id]} ${getText('days')}! +${streakRewards[newStreaks[habit.id]]} ${getText('points')}`
            );
          }
        } else {
          newStreaks[habit.id] = 0; // Reset streak if not completed
        }
      });
      setStreaks(newStreaks);
      setTodayHabits([]);
      setPurchases([]);
      setCompletedToday(0);
      setCurrentDate(today);
      await saveData();
      await scheduleDailyReminder();
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
        completedToday,
        streaks,
      };
      await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
      Alert.alert('Ошибка сохранения данных: ' + error.message);
    }
  };

  const loadData = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(FILE_PATH);
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
        setCompletedToday(parsedData.completedToday || 0);
        setStreaks(parsedData.streaks || {});
      } else {
        setPoints(0);
        setLives(3);
        setTheme('light');
        setLanguage('ru');
        setCompletedToday(0);
        setStreaks({});
        await saveData();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Ошибка загрузки данных: ' + error.message);
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
      isImportant: isImportant,
    };

    let newSavedHabits = savedHabits;
    let newTodayHabits = todayHabits;

    if (saveToSaved) {
      newSavedHabits = [...savedHabits, habitObj];
      setSavedHabits(newSavedHabits);
      setStreaks(prev => ({ ...prev, [habitObj.id]: 0 }));
    }
    newTodayHabits = [...todayHabits, { ...habitObj, id: `${habitObj.id}-${currentDate}` }];
    setTodayHabits(newTodayHabits);
    setNewHabit('');
    setIsImportant(false);
    setShowHabitSelector(false);

    await saveData();
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

  const completeHabit = async (id) => {
    const habit = todayHabits.find(h => h.id === id);
    if (habit) {
      setTodayHabits(prev =>
        prev.map(h =>
          h.id === id ? { ...h, status: 'completed' } : h
        )
      );
      setPoints(prev => prev + 5);
      setCompletedToday(prev => prev + 1);
      await saveData();
    }
  };

  const deleteSavedHabit = async (id) => {
    setSavedHabits(prev => prev.filter(habit => habit.id !== id));
    setTodayHabits(prev => prev.filter(habit => habit.id.split('-')[0] !== id));
    setStreaks(prev => {
      const newStreaks = { ...prev };
      delete newStreaks[id];
      return newStreaks;
    });
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
          backgroundColor: item.isImportant
            ? '#FFFF99'
            : theme === 'light'
            ? '#fff'
            : '#333',
        },
      ]}
    >
      <TouchableOpacity
        style={styles.habitTextContainer}
        onPress={() => completeHabit(item.id)}
      >
        <Text style={{ color: item.isImportant ? '#000' : theme === 'light' ? '#000' : '#fff' }}>
          {item.title}
          {item.status === 'completed' ? ` ✓` : ''}
        </Text>
        <Text style={styles.streakText}>
          {getText('streak')}: {streaks[item.id.split('-')[0]] || 0} {getText('days')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSavedHabit = ({ item }) => (
    <View style={[styles.habitItem, { backgroundColor: theme === 'light' ? '#fff' : '#333' }]}>
      <TouchableOpacity
        style={styles.habitTextContainer}
        onPress={() => addSavedHabitToToday(item)}
      >
        <Text style={{ color: theme === 'light' ? '#000' : '#fff' }}>
          {item.title} {item.isImportant && `(${getText('important')})`}
        </Text>
        <Text style={styles.streakText}>
          {getText('streak')}: {streaks[item.id] || 0} {getText('days')}
        </Text>
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
      <Text style={themeStyles.text}>
        {item.name} - {item.cost} {getText('points')}
      </Text>
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
      lightTheme: 'Светлая',
      darkTheme: 'Темная',
      russian: 'Русский',
      english: 'English',
      spanish: 'Español',
      points: 'Баллы',
      lives: 'Жизни',
      buy: 'Купить',
      purchased: 'Куплено',
      exitTitle: 'Выход',
      exitMessage: 'Вы уверены, что хотите выйти?',
      cancel: 'Отмена',
      exit: 'Выйти',
      important: 'Важная',
      completedToday: 'Выполнено сегодня',
      streak: 'Серия',
      days: 'дней',
      reminderTitle: 'Напоминание о привычках',
      reminderBody: 'Не забудьте выполнить свои привычки сегодня!',
      notificationPermissionTitle: 'Разрешение на уведомления',
      notificationPermissionMessage: 'Пожалуйста, разрешите уведомления для напоминаний о привычках.',
      streakRewardTitle: 'Награда за серию!',
      streakRewardMessage: 'Поздравляем! Вы выполнили привычку',
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
      lightTheme: 'Light',
      darkTheme: 'Dark',
      russian: 'Русский',
      english: 'English',
      spanish: 'Español',
      points: 'Points',
      lives: 'Lives',
      buy: 'Buy',
      purchased: 'Purchased',
      exitTitle: 'Exit',
      exitMessage: 'Are you sure you want to exit?',
      cancel: 'Cancel',
      exit: 'Exit',
      important: 'Important',
      completedToday: 'Completed today',
      streak: 'Streak',
      days: 'days',
      reminderTitle: 'Habit Reminder',
      reminderBody: 'Don’t forget to complete your habits today!',
      notificationPermissionTitle: 'Notification Permission',
      notificationPermissionMessage: 'Please allow notifications for habit reminders.',
      streakRewardTitle: 'Streak Reward!',
      streakRewardMessage: 'Congratulations! You’ve completed the habit for',
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
      lightTheme: 'Claro',
      darkTheme: 'Oscuro',
      russian: 'Русский',
      english: 'English',
      spanish: 'Español',
      points: 'Puntos',
      lives: 'Vidas',
      buy: 'Comprar',
      purchased: 'Comprado',
      exitTitle: 'Salir',
      exitMessage: '¿Estás seguro de que quieres salir?',
      cancel: 'Cancelar',
      exit: 'Salir',
      important: 'Importante',
      completedToday: 'Completado hoy',
      streak: 'Racha',
      days: 'días',
      reminderTitle: 'Recordatorio de Hábitos',
      reminderBody: '¡No olvides completar tus hábitos hoy!',
      notificationPermissionTitle: 'Permiso de Notificaciones',
      notificationPermissionMessage: 'Por favor, permite las notificaciones para recordatorios de hábitos.',
      streakRewardTitle: '¡Recompensa por Racha!',
      streakRewardMessage: '¡Felicidades! Has completado el hábito durante',
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
          <Image source={require('./assets/icon.png')} style={styles.appIcon} />
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
          style={[styles.importantButton, { backgroundColor: isImportant ? '#FFD700' : '#ccc' }]}
          onPress={() => setIsImportant(!isImportant)}
        >
          <Text style={styles.importantButtonText}>{getText('important')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (newHabit.trim() === '') {
              setShowHabitSelector(true);
            } else {
              addNewHabit(false);
            }
          }}
        >
          <Text style={styles.addButtonText}>
            {newHabit.trim() === '' ? getText('add') : '✓'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuVisible} animationType="slide" transparent={true}>
        <View style={[styles.menuContainer, themeStyles.menuContainer]}>
          <TouchableOpacity style={styles.menuClose} onPress={() => setMenuVisible(false)}>
            <AntDesign name="close" size={24} color={themeStyles.menuIconColor} />
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, themeStyles.menuText]}>{getText('habits')}</Text>
          {todayHabits.filter(h => h.isImportant).length > 0 && (
            <View style={styles.importantHabitsContainer}>
              <Text style={[styles.subSectionTitle, themeStyles.menuText]}>
                {getText('important')}:
              </Text>
              {todayHabits.filter(h => h.isImportant).map(h => (
                <Text key={h.id} style={[styles.importantHabitText, { color: '#000' }]}>
                  {h.title}
                </Text>
              ))}
            </View>
          )}
          <FlatList
            data={savedHabits}
            renderItem={renderSavedHabit}
            keyExtractor={item => item.id}
            style={styles.list}
          />
          <View style={styles.statsContainer}>
            <Text style={[styles.menuText, themeStyles.menuText]}>
              {getText('completedToday')}: {completedToday}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowSettings(true);
              setMenuVisible(false);
            }}
          >
            <Text style={[styles.menuText, themeStyles.menuText]}>{getText('settings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowStore(true);
              setMenuVisible(false);
            }}
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
            <TouchableOpacity style={styles.themeButton} onPress={() => setShowLanguageModal(true)}>
              <Text style={themeStyles.text}>
                {language === 'ru' ? 'Русский' : language === 'en' ? 'English' : 'Español'}
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
    flexWrap: 'wrap',
  },
  pointsContainer: { flexDirection: 'row', alignItems: 'center' },
  livesContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  headerText: { fontSize: 18, marginLeft: 5 },
  appIcon: { width: 32, height: 32, marginRight: 10 },
  sectionTitle: { paddingHorizontal: 20, marginBottom: 10 },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  importantButton: {
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  importantButtonText: { color: '#000', fontSize: 14 },
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
  importantHabitsContainer: { paddingHorizontal: 20, marginBottom: 10 },
  subSectionTitle: { fontSize: 16, fontWeight: 'bold' },
  importantHabitText: { fontSize: 14, marginVertical: 2 },
  statsContainer: { paddingHorizontal: 20, marginVertical: 10 },
  streakText: { fontSize: 12, color: '#666', marginTop: 5 },
});
