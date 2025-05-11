import pygame
from random import randint
from pygame import *
import os
from heroes_frame import*
WINDOW_WIDTH, WINDOW_HEIGHT = 1200, 600
window = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
class Area:
    def __init__(self, x, y, width, height, color):
        self.rect = pygame.Rect(x, y, width, height)
        self.fill_color = color
    def set_color(self, new_color):
        self.fill_color = new_color
    def fill(self):
        pygame.draw.rect(window, self.fill_color, self.rect)
    def colliderect(self, rect):
        return self.rect.colliderect(rect)

class Picture(Area):
    def __init__(self, filename, x=0, y=0, width=10, height=10):
        Area.__init__(self, x=x, y=y, width=width, height=height, color=None)
        self.image = pygame.image.load(filename).convert_alpha()
        self.original_image = pygame.transform.scale(self.image, (width, height))
        self.image = self.original_image
    def show(self):
        window.blit(self.image, (self.rect.x, self.rect.y))

class Hero(Picture):
    def __init__(self, frames, x=0, y=0, width=50, height=50):
        # Використовуємо перший кадр правої анімації як початковий
        first_frame_right = frames[1][0]
        Picture.__init__(self, first_frame_right, x, y, width, height)
        self.circle = Picture(os.path.join("picture","circle.png"), 0, 0, 150, 150)
        self.speed = 5
        self.jump_speed = -10
        self.gravity = 0.5
        self.y_velocity = 0
        self.on_ground = False
        self.ground_level = y
        self.direction = "right"
        self.dop_speed = 200
        self.damage = 1
        self.max_frame_count = 14
        # Завантаження та масштабування кадрів
        self.walk_left_frames = [pygame.transform.scale(pygame.image.load(f).convert_alpha(), (width, height)) for f in frames[0]]
        self.walk_right_frames = [pygame.transform.scale(pygame.image.load(f).convert_alpha(), (width, height)) for f in frames[1]]

        self.stand_image = self.walk_right_frames[0]
        self.base_height = height
        self.current_frame = 0
        self.frame_count = 0
        self.is_moving = False

    def animate_standing(self):
        self.image = self.stand_image
    def shadow(self,enemy,enemy_health):
        global fr
        fr+=1
        if fr >= 10:
            self.rect.x = enemy.rect.x
            if fr >=55:
                self.rect.x = randint(200, WINDOW_WIDTH - 200)
                fr = 0
    def defance(self, enemys):
        global health_rect
        self.healing = 0.2
        for enemy in enemys:
            if self.colliderect(enemy):
                health_rect.rect.width += 5
        
        seijiro_health.rect.width+=self.healing
        self.circle.show()
        
        self.circle.rect.x = self.rect.x-10
        self.circle.rect.y = self.rect.y-10
    def animate_walking(self):
        self.frame_count += 1
        if self.frame_count >= self.max_frame_count:
            self.current_frame = (self.current_frame + 1) % len(self.walk_right_frames)
            if self.direction == "right":
                self.image = self.walk_right_frames[self.current_frame]
            else:
                self.image = self.walk_left_frames[self.current_frame]
            self.frame_count = 0
    def animate_standing(self):
        # Adjust the height and position to simulate crouching
        crouch_offset = 10
        self.image = self.stand_image
        self.rect.height = self.base_height - crouch_offset
        self.rect.y += crouch_offset
        # Reset height and position after simulating crouch
        self.rect.height = self.base_height
        self.rect.y -= crouch_offset
    def update(self):
        self.y_velocity += self.gravity
        self.rect.y += self.y_velocity

        # Перевірка, чи на землі
        if self.rect.y + self.rect.height >= self.ground_level + self.base_height:
            self.rect.y = self.ground_level
            self.y_velocity = 0
            self.on_ground = True

        # Анімація
        if self.is_moving:
            self.animate_walking()
        else:
            self.animate_standing()
hero = Hero(frames= hero_frame,x=200, y=450, width=100, height=110)

# Підключимо музику на задній фон гри
mixer.init()
mixer.music.load(os.path.join("audio", "1.mp3")) 
mixer.music.set_volume(0.5)  
# mixer.music.play(-1)  # Play the music in a loop

falling_bones = []
def set_text(text, x, y, color=(255, 255, 255), font_size=30):
    font = pygame.font.Font(None, font_size)
    text_surface = font.render(text, True, color)
    window.blit(text_surface, (x, y))
frame_lose = 0
def window_lose():
    window.fill((0, 0, 0))
    set_text("Ти програв! Зараз ти повернешся ", 200, 300, (255, 0, 0), font_size=50)
    set_text("повернешся до гри ", 200, 330, (255, 0, 0), font_size=50)

def falling_bones_attack(hero):
    global falling_bones, health_rect,seijiro
    seijiro.rect.y = 100
    if not falling_bones:
        falling_bones = [Picture(os.path.join("picture","fire.png"), randint(0, WINDOW_WIDTH - 50), randint(-600, -50), 50, 50) for _ in range(20)]
    for bone in falling_bones:
        bone.rect.y += 15  
        if bone.rect.y > WINDOW_HEIGHT:
            bone.rect.y = randint(-600, -50) 
            bone.rect.x = randint(0, WINDOW_WIDTH - bone.rect.width)
        if bone.colliderect(hero.rect):
            health_rect.rect.width -= 1
    
    for bone in falling_bones:
        bone.show()
def run():
    global hero, keys
    keys = pygame.key.get_pressed()
    hero.is_moving = False

    # Horizontal movement
    if keys[K_RIGHT]:
        hero.rect.x += hero.speed
        hero.is_moving = True
        hero.direction = "right"
    if keys[K_LEFT]:
        hero.rect.x -= hero.speed
        hero.is_moving = True
        hero.direction = "left"

    # Jumping
    if keys[K_SPACE] and hero.on_ground:
        hero.y_velocity = hero.jump_speed
        hero.on_ground = False

    # Apply gravity and update vertical position
    hero.y_velocity += hero.gravity
    hero.rect.y += hero.y_velocity

    # Check if hero is on the ground
    if hero.rect.y + hero.rect.height >= hero.ground_level + hero.base_height:
        hero.rect.y = hero.ground_level
        hero.y_velocity = 0
        hero.on_ground = True

    # Animate walking or standing
    if hero.is_moving:
        hero.animate_walking()
    else:
        hero.animate_standing()
l = 0
def arrows_attack():
    global arrows, hero, health_rect, frame, background, ladder,l,k, keys, ladder2
    background = Picture(os.path.join("picture", "libruary.png"), 0, 0, WINDOW_WIDTH, WINDOW_HEIGHT)
    ladder = Picture(os.path.join("picture", "ladder.png"), 200, 300, 80, 350)
    ladder2 = Picture(os.path.join("picture", "ladder.png"), 900, 300, 80, 350)
    ladder.show()
    ladder2.show()
    hero.speed = 15
    if 'arrows' not in globals():
        arrows = []

    if frame % 60 == 0 and len(arrows) < 10:  # Спавн та максимальна кількість
        side = randint(0, 1)  # Рандомна сторона
        l+=1
        if side == 0:  # Left
            arrow = Picture(os.path.join("picture", "arrow.png"), -50, randint(0, WINDOW_HEIGHT - 50), 150, 10)
            arrow.direction = "right"
        elif side == 1:  # Right
            arrow = Picture(os.path.join("picture", "arrow.png"), WINDOW_WIDTH + 50, randint(0, WINDOW_HEIGHT - 50), 150, 10)
            arrow.direction = "left"
        arrows.append(arrow)
        if l>=90:
            k+=1
    if hero.colliderect(ladder) or hero.colliderect(ladder2):
        if keys[K_UP]:
            hero.rect.y -= 15
        if keys[K_DOWN]:
            hero.rect.y += 15
    else: 
        hero.rect.y = 450
    # Move and display arrows
    for arrow in arrows:
        if arrow.direction == "right":
            arrow.rect.x += 30
        elif arrow.direction == "left":
            arrow.rect.x -= 30

        arrow.show()

        # Перевірка зіткнень
        if arrow.colliderect(hero):
            health_rect.rect.width -= 2  # Знижуємо зборов'я героя

    # Видаляєво, якщо вийшло за екран
    arrows = [arrow for arrow in arrows if -50 < arrow.rect.x < WINDOW_WIDTH + 50]

e = 0
switch = "start"
button_enter = Area(1000, 150, 100, 50, (30, 0, 0))  # Define button_enter here
def show_text(active_text, x=10, y=10, color=(255, 255, 255), font_size=30, show_items=[]):
    global button_enter, quad, e, k,font, event
    if event.type == pygame.KEYDOWN:
        e += 1
    if e >= len(active_text):
        k += 1
        e = 0
        return
    for item in show_items:
        item.show()
    if e >= len(active_text):
        k += 1
        e = 0  
    font = pygame.font.Font(None, font_size)
    quad = Area(x, y, 1150, 200, (0, 0, 0))
    quad.fill()
    button_enter.fill()
    text_surface = font.render(active_text[e], True, color)
    txt_enter = font.render("Enter", True, (255, 255, 255))

    window.blit(text_surface, (x + 10, y + 10))
    window.blit(txt_enter, (button_enter.rect.x + 10, button_enter.rect.y + 10))

i = 0
line = "_____________________________________________________________________________________________________________________________________________"

def start():
    if set_pause:
        pause_game()
    else:        
        global i,k
        farian.show()
        farian.direction = "left"
        farian.animate_walking()
        farian.rect.x -= 5
        i+=1
        if i >= 90:
            k+=1
            farian.rect.x = 0
            i = 0
portal = Picture(os.path.join("picture","portal.png"), WINDOW_WIDTH-220, WINDOW_HEIGHT-300, 200, 250)
def end():
    if set_pause:
        pause_game()
    else:
        global portal, k,background, hero
        portal.show()
        if hero.colliderect(portal):
            k+=1
            background = Picture(os.path.join('picture','2.png'), 0, 0, 1200, 600)
            hero.rect.x = WINDOW_WIDTH/2 - hero.rect.width
frame = 0
n = 0
btn = Picture(os.path.join("picture","btn.png"), 800, WINDOW_HEIGHT-50, 50, 50)
def first_exam():
    if set_pause:
        pause_game()
    else:
        global frame, k, hero, background,btn, n
        global background
        btn.show()
        background = Picture(os.path.join('picture','2.png'), 0, 0, 1200, 600)
        hero.speed = 12
        frame+=1
        if frame >= 90 or hero.colliderect(btn):
            n+=1
            btn.rect.x = randint(200, 1000)
            frame = 0
        if n>=10:
            k+=1
fire = Picture(os.path.join("picture","fire.png"), 500, WINDOW_HEIGHT, 50, 50)
def the_case():
    if set_pause:
        pause_game()
    else:
        global k, frame, hero, case,fire,background
        hero.speed = 5
        global case, k
        case = Hero(frames=[[],[os.path.join("picture","case_1.png"),os.path.join("picture","case_2.png")]], x=WINDOW_WIDTH-150, y=WINDOW_HEIGHT-70, width=100, height=100)
        case.show()
        case.animate_standing()
        if hero.colliderect(case):
            fire.show()
            hero.speed = 0
            fire.rect.y-=1
            frame+=1
            if frame >= 150:
                k+=1
                background = Picture(os.path.join('picture','3.png'), 0, 0, 1200, 600)

def second_exam():
    if set_pause:
        pause_game()
    else:
        global frame, k, hero, platforms, max_platforms, platform_spawn_rate,background,lava, seijiro, health_rect, seijiro_health,frame_lose,lava
        background = Picture(os.path.join('picture','3.png'), 0, 0, 1200, 600)
        hero.speed = 5
        seijiro.damage = 1.5
        lava.show()
        lava.animate_walking()
        if hero.colliderect(lava):
            health_rect.rect.width -= 1
        if health_rect.rect.width <= 0:        
            frame_lose += 1
            window_lose()
            if frame_lose >= 100:
                health_rect.rect.width = 200
                frame = 0
                frame_lose = 0


        if 'platforms' not in globals():
            platforms = []
            max_platforms = 5
            platform_spawn_rate = 30 
        if frame % platform_spawn_rate == 0 and len(platforms) < max_platforms:
            platform_x = randint(300, WINDOW_WIDTH - 200)
            platform_y = randint(100, WINDOW_HEIGHT - 200)
            platform = Area(platform_x, platform_y, 150, 20, (100, 100, 255))
            platforms.append(platform)

        for platform in platforms:
            platform.rect.y += 2
            platform.fill()

        platforms = [platform for platform in platforms if platform.rect.y < WINDOW_HEIGHT]

        for platform in platforms:
            if hero.colliderect(platform) and hero.y_velocity > 0:
                hero.y_velocity = hero.jump_speed
                hero.on_ground = True

        frame += 1
        if frame >= 1000: 
            k += 1
            frame = 0
            background = Picture(os.path.join('picture','4.jpg'), 0, 0, 1200, 600)
seijiro = Hero(frames=seijirou_frame, x=-200, y=WINDOW_HEIGHT-150, width=100, height=110)
def needle_attack():
    global needle, hero, health_rect, frame
    needle.show()
    frame += 1
    if frame % 50 == 0:  # Шипы появляются каждые 50 кадров
        needle.rect.x = randint(0, WINDOW_WIDTH - needle.rect.width)
        needle.rect.y = WINDOW_HEIGHT - needle.rect.height

    if hero.colliderect(needle):
        health_rect.rect.width -= 2  # Уменьшаем здоровье героя при столкновении

fr = 0
def in_water_town():
    if set_pause:
        pause_game()
    else:
        global k, seijiro, frame
        frame+=1
        if frame >= 90:
            k+=1
            frame = 0
        seijiro.show()
        seijiro.direction = "right"
        seijiro.animate_walking()
        seijiro.rect.x += 5
seijiro_health = Area(0, 0, 200, 20, (255, 0, 0))
m = randint(0,2)
rand_x = randint(0, WINDOW_WIDTH - 200)
def cheet():
    global frame, health_rect
    frame+=1
    if frame >=30:
        hero.rect.x = randint(200,WINDOW_WIDTH-200)
        health_rect.rect.width -= 0.5
        frame = 0
water_ball = Picture(os.path.join("picture","water_ball.png"),0,0,50,50)
tem_switch = "start"
def tem_hide():
    global water_ball,hero,tem_switch,temarius,WINDOW_HEIGHT
    water_ball.show()
    if tem_switch == "start":
        water_ball.rect.x = temarius.rect.x-10
        water_ball.rect.y = temarius.rect.y-10
        tem_switch = "stop"
    if tem_switch == "stop":
        water_ball.rect.y+=15
    if water_ball.rect.y >= WINDOW_HEIGHT:
        tem_switch = "start"
    if water_ball.colliderect(hero):
        health_rect.rect.width -= 3


def fight(main, enemy, health, enemy_attacks=[]):
    global k, frame, m, frame_lose, health_rect, line, rand_x, fire
    if set_pause:
        pause_game()
        return
    if enemy.rect.x <= rand_x:
        enemy.rect.x += 5.5
        enemy.direction = "right"
    if enemy.rect.x >= rand_x:
        enemy.rect.x -= 5.5
        enemy.direction = "left"
    if enemy.rect.x == rand_x:
        rand_x = randint(200, WINDOW_WIDTH - 200)
    health.fill()
    enemy.rect.y = 200
    set_text(line, 0, 310, (255, 255, 255), font_size=30)
    enemy.direction = "left" if main.rect.x >= enemy.rect.x else "right"
    enemy.animate_walking()

    if main.colliderect(enemy):
        enemy.rect.x = randint(200, WINDOW_WIDTH - 200)

    if health_rect.rect.width <= 0:
        frame_lose += 1
        window_lose()
        if frame_lose >= 100:
            health_rect.rect.width = health.rect.width = 200
            frame_lose = 0

    frame += 1
    enemy.show()
    if enemy_attacks:
        enemy_attacks[m]()
    if frame >= 90:
        previous_m = m
        while True:
            m = randint(0, len(enemy_attacks) - 1)
            if m != previous_m:  
                break
        frame = 0
    if health.rect.width <=0:
        k += 1
        health.rect.width = health_rect.rect.width = 200
        


def after_fight():
    if set_pause:
        pause_game()
    else:
        global k, hero, WINDOW_WIDTH,portal, warNolar, warNolar_health, enemy_person, enemy_health
        portal.show()
        enemy_person = warNolar
        enemy_health = warNolar_health
        if hero.colliderect(portal):
            k += 1
            hero.rect.x = WINDOW_WIDTH/2 - hero.rect.width
needle = Picture(os.path.join("picture","needle.png"), 0, 0, 50, 400)
switch2 = "start"
s = 0
a = 0
def in_his_town():
    if set_pause:
        pause_game()
    else:
        global k, hero,s,background, needle, switch2,a,temarius
        background = Picture(os.path.join('picture','4.jpg'), 0, 0, 1200, 600)
        if switch2 == "start":
            needle.rect.x = hero.rect.x-10
            needle.rect.y = WINDOW_HEIGHT - 20
            switch2 = "stop"
        if switch2 == "stop":
            s+=1
            if s >= 70:
                needle.rect.y -= 20
            if s >= 140:
                switch2 = "start"
                a+=1
            
            temarius.show()
        needle.show()
        if hero.colliderect(needle):
            health_rect.rect.width -= 1
temarius = Hero(frames=temarius_frame, x=hero.rect.x, y=200, width=100, height=110)
temarius_health = Area(0, 0, 200, 20, (255, 0, 0))
fight_frame = 0
gate = Picture(os.path.join("picture","gate.png"), 0, 0, 200, 200)
def the_end():
    global to_menu
    window.fill((0, 0, 0))
    to_menu.fill()
    set_text("Меню", to_menu.rect.x+10, to_menu.rect.y+10, (0, 0, 0), font_size=30)


def warNolar_show():
    global warNolar,frame,k,enemy_health,enemy_person
    warNolar.show()
    enemy_person = temarius
    enemy_health = temarius_health
    frame+=1
    if frame >=70:
        warNolar.rect.x -=5
    if frame>=100:
        enemy_person = temarius
        enemy_health = temarius_health
        k+=1
purple_circle = Picture(os.path.join("picture","purple_circle.png"), 0, 0, 150, 150)
second_text = [
    "Ти потрапив до печери...",
    "Тобі потрібно забрати артефакт вогню, який стане твоєю силою.",
    "Збери всі фрагменти, щоб з’явився скриня.",
    "Успіхів!"
]

first_text = [
    "Привіт!",
    "Чому ти тут гуляєш так пізно?",
    "Я зрозумів...",
    "Ти шукаєш артефакт.",
    "Виходить, ти вже чув про те, що Темаріус шукає артефакти.",
    " Кажуть, що він зібрав уже всі, окрім вогню. Зібравши всі,",
    "у нього буде така сила, що він зможе володіти Всесвітом.",
    "У легендах говориться, що лише один із міста Вогню зможе перемогти його."
    "Заходь у портал, я поясню, що робити."
]

warnining = [
    "О ніііі!!!",
    "Схоже, ворог зрозумів, що ти отримав артефакт.",
    "Зараз вони точно атакуватимуть тебе...",
    "Використовуй літаючі платформи, щоб не торкатися землі, бо це небезпечно!",
    "Жителі міста Води врятують тебе, а поки — стрибай по платформах. Успіхів!"
]

talk_with_human = [
    "Привіт! Мені ледь вдалося тебе врятувати.",
    "Не знаю, що було б з тобою...",
    "Зараз ти в місті Води.",
    "Кажуть, що коли настане час, ти переможеш Темаріуса.",
    "Я хочу в це вірити.",
    "Зараз повинен прийти наш найкращий учитель.",
    "Він навчить тебе використовувати свою силу."
]

before_first_fight = [
    "Добрий день! Мене звати Сейджуро, і я навчу тебе використовувати свою силу.",
    "Мене просто попросили...",
    "Я не знаю чому, але я відчуваю, що ти можеш стати сильним.",
    "Ти повинен навчитися використовувати свою силу, щоб перемогти Темаріуса.",
    "Але спочатку — як битися. Тобі знадобиться всього три клавіші: ",
    "f — атака, g — захист, h — сховатися. ",
    "Ти можеш дізнатися більше, натиснувши на кнопку з трьома лініями.",
    "А зараз подивимось, як швидко ти все зрозумієш.",
    "До бою!"
]

before_second_fight = [
    "Ти молодець!",
    "Тепер ти можеш використовувати свою силу, щоб перемогти Темаріуса.",
    "Не думав, що ти так швидко вчишся.",
    "Схоже, лише на тебе вся надія. Щоб це перевірити, я буду битися сильніше!",
    "До бою!"
]

after_fight_text = [
    "Сейджуро зник...",
    "Ти переміг його!",
    "Але він сказав, що ти повинен перемогти Темаріуса.",
    "Тепер ти можеш йти далі. Ти молодець!",
    "Заходь у портал, щоб повернутися до твого рідного містечка."
]

warNolar_text = [
    "Я чекав на тебе...",
    "Мені так легко вдалося захопити твоє містечко. А ти втік, залишивши його в біді.",
    "Але зараз не до цього — мені потрібен лише твій артефакт.",
    "**Схоже, Темаріус збирається атакувати. Тобі потрібно тікати від голок під тобою, інакше вони тебе знищать.**"
]

temarius_text = [
    "Темаріус: Я чекав на тебе...",
    "Я знаю, що ти можеш перемогти мене, але я не дозволю тобі цього зробити.",
    "Ти повинен пройти через мене, щоб дістатися до артефакту.",
    "Але я не дозволю цього! І заберу артефакт вогню. Я стану настільки сильним, ",
    "що мені не буде рівних. Ну що ж, не будемо гаяти часу!"
]
before_temarius = ["***Схоже тут поставлені пастки***,","Ну звісно, Темаріус хоче ослабити тебе","Щоб там не було, ти можеш використовувати драбини","І підійматися по ним якщо це необхіно"]
after_temarius = ["Аж не віриться!","Ти зміг перемогти Темаріуса!","Тепер нашому містечку нічого не загрожує","Ти молодець!","Думаю король зрадіє, тому що ти переміг!"]
instructions = [
    "Управління: стрілочки на клавіатурі.",
    "Атаки: F — атака вогняними кулями,"," H — довгий стрибок уперед, ","G — захисний бар’єр.",
    "Усі кнопки — натискні.",
    "Enter — перехід на наступний текст.","Якщо хочете пропустити рівень","натисніть P на клавіатурі"
]

health_rect = Area(WINDOW_WIDTH-220,10, 200, 20, (255, 0, 0))
warNolar_health = Area(0, 0, 200, 20, (255, 0, 0))
def return_to_sender():
    global fire, hero, warNolar
    if fire.colliderect(warNolar):
        fire.rect.y+=200
        warNolar_health.rect.width +=1  # Зменшуємо здоров'я ворога

def war_defance():
    if fire.colliderect(warNolar):
        global purple_circle
        purple_circle.show()
        purple_circle.rect.x = warNolar.rect.x-20
        purple_circle.rect.y = warNolar.rect.y-20
        health_rect.rect.width -= 5
seijiro_attacks = [
    lambda: falling_bones_attack(hero),
    lambda: seijiro.defance([hero]),
    lambda: seijiro.shadow(hero, enemy_health=health_rect)
]
def gate_attack():
    global gate, set_run, hero,frame_lose,frame
    gate = Picture(os.path.join("picture","gate.png"),hero.rect.x -30, hero.rect.y-30,110,110)
    gate.show()
    health_rect.rect.width -=0.1
    if health_rect.rect.width <= 0:        
        frame_lose += 1
        window_lose()
        if frame_lose >= 100:
            health_rect.rect.width = 200
            frame = 0
            frame_lose = 0
# списки атак босів
temarius_attack = [lambda: needle_attack(), lambda:tem_hide(),lambda:falling_bones_attack(hero),lambda:gate_attack()]
warNolar_attacks = [lambda:return_to_sender(),lambda:war_defance(),lambda:needle_attack()]
way = Picture(os.path.join("picture","pixilart-drawing (8).png"),500,300,200,120)
def cor():
    global way,hero, k, frame
    frame = 0
    hero.speed = 5
    way.show()
    if hero.rect.x>=WINDOW_WIDTH-120:
        k+=1
        hero.rect.x = 200
def timer(max):
    global frame,k
    frame+=1
    if frame >= max:
        k+=1
        frame = 0

# створення сюжетного листа
plot_list = [lambda:start(),lambda:show_text(first_text, 10, 10, font_size=30, show_items=[farian]),lambda:end(),lambda:timer(50),
             lambda:show_text(second_text, 10, 10, font_size=30),lambda:timer(50),
             lambda:first_exam(), lambda:the_case(),lambda:timer(50),lambda:show_text(warnining, 10, 10, font_size=30),lambda:timer(50),
             lambda:second_exam(),lambda:show_text(talk_with_human,10,10,font_size=30,show_items=[human]), lambda:in_water_town(),lambda:timer(50),
             lambda:show_text(before_first_fight,10,10,font_size=30),lambda:timer(50),
             lambda:fight(hero,seijiro,seijiro_health,enemy_attacks=seijiro_attacks),lambda:timer(50),lambda:show_text(before_second_fight,10,10,font_size=30),
             lambda:timer(50),lambda:fight(hero,seijiro,seijiro_health,enemy_attacks=seijiro_attacks),lambda:timer(50),
             lambda:show_text(after_fight_text,10,10,font_size=30),lambda:cor(),
             lambda:after_fight(),lambda:timer(50),lambda:warNolar_show(),lambda:timer(50),
             lambda:show_text(warNolar_text,10,10,font_size=30,show_items=[warNolar]),lambda:timer(50),
             lambda: fight(hero,warNolar,warNolar_health, enemy_attacks=warNolar_attacks),lambda:timer(50),lambda:cor(),lambda:timer(50),
             lambda:show_text(before_temarius,10,10,font_size=30),lambda:timer(50),lambda:arrows_attack(),lambda:timer(50),
             lambda:cor(),lambda:cor(),lambda:timer(50),
             lambda:show_text(temarius_text,10,10,font_size=30),lambda:in_his_town(),lambda:timer(50),
             lambda:fight(hero,temarius,temarius_health,enemy_attacks=temarius_attack),lambda:cor(),lambda:timer(50),
             lambda:start(),lambda:show_text(after_temarius,10,10,font_size=30)
             ]
k = 0
def plot():
    global k, url, background, hero, plot_list, e, quad
    plot_list[k]()
# Ініціалізація
pygame.init()
clock = pygame.time.Clock()
FPS = 60


url = os.path.join("picture","1.png")
background = Picture(url, 0, 0, 1200, 600)
human = Picture(os.path.join("picture","human.png"), WINDOW_WIDTH-400, 450, 100, 110)
warNolar = Hero(frames=warNolar, x=WINDOW_WIDTH, y=450, width=100, height=110)
heart = Picture(os.path.join("picture","heart.png"),920,2,50,50)
farian = Hero(frames=farian_frame, x=1000, y=450, width=100, height=110)
leaf = Hero(frames=leaf_frame, x=0, y=0, width=WINDOW_WIDTH, height=WINDOW_HEIGHT)
lava = Hero(frames=lava_frame, x=0, y=WINDOW_HEIGHT-50, width=WINDOW_WIDTH, height=50)
to_menu = Area(0, 0, 150, 80, (255, 255, 255))
to_game = Area(450, 200, 350, 150, (255, 255, 255))
to_boss = Area(WINDOW_WIDTH-160, WINDOW_HEIGHT-90, 150, 80, (255, 0,0))
set_pause = False
pause = Picture(os.path.join("picture","pause.jpg"), 7, 0, 50, 50)
menu = Picture(os.path.join("picture","menu.png"),7,80,50,50)
def fire_attack(enemys = [seijiro,warNolar,temarius]):
    global fire, switch,show_fire,en
    fire.show()
    if switch == "start":
        fire.rect.x = hero.rect.x-10
        fire.rect.y = hero.rect.y-10
        switch = "stop"
    if switch == "stop":
        fire.rect.y-=15
    if fire.rect.y <= 0:
        show_fire = False
        switch = "start"
    for en in enemys:
        if fire.colliderect(en):
            if en == seijiro:
                seijiro_health.rect.width -= 3
            elif en == warNolar:
                warNolar_health.rect.width -= 3
            elif en == temarius:
                temarius_health.rect.width -= 3
def hide():
    global hero,hiding
    if hero.direction == "right":
        hero.rect.x += hero.dop_speed
    if hero.direction == "left":
        hero.rect.x -= hero.dop_speed
    hiding = False
def pause_game():
    pass
running = True
show_fire = False
letsgo = False
hiding = False
p = 0
enemy_person = seijiro
enemy_health = seijiro_health
set_attacks = True
set_run = True
set_menu = True

set_inst = False
ins = Picture(os.path.join("picture","tips.png"),20,20,150,70)
ins_back = Area(10,10,400,WINDOW_HEIGHT,(200,0,0))
close = Picture(os.path.join("picture","close.png"),20,20,30,30)
boss_fight_start = False
while running:
    mouse_x, mouse_y = pygame.mouse.get_pos()
    background.show()
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                if button_enter.rect.collidepoint(mouse_x, mouse_y):
                    e += 1  
                if pause.rect.collidepoint(mouse_x, mouse_y):
                    set_menu = False
                    set_pause = not set_pause
                if to_game.rect.collidepoint(mouse_x, mouse_y): 
                    set_menu = False
                    set_pause = False
                    set_attacks = True
                    set_run = True
                if menu.rect.collidepoint(mouse_x,mouse_y):
                    set_menu = True
                if to_menu.rect.collidepoint(mouse_x, mouse_y): 
                    set_menu = True
                    set_pause = False
                    set_attacks = False
                    set_run = False
                if to_boss.rect.collidepoint(mouse_x, mouse_y):
                    k+=1
                    background = Picture(os.path.join("picture","7.png"))
                    set_run = True
                    set_attacks = True
                if ins.rect.collidepoint(mouse_x,mouse_y):
                    set_inst = True
                if close.rect.collidepoint(mouse_x,mouse_y):
                    set_inst = False

        if set_attacks:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_f:
                    show_fire = True
                elif event.key == pygame.K_g:
                    letsgo = True
                elif event.key == pygame.K_h:
                    hiding = True
                elif event.key == pygame.K_p:
                    if fight:
                        k+=1
        if set_pause:
            pause_game()
    if set_menu:
        if k>16:
            k = 0
            set_menu=True
        set_run = False
        set_attacks = False
        set_pause = False
        window.fill((0, 0, 0))
        to_game.fill()
        ins.show()

        if set_inst:
            ins_back.fill()
            close.show()
            set_text(instructions[0],30,60,(255,255,255),font_size=30)
            set_text(instructions[1],30,90,(255,255,255),font_size=30)
            set_text(instructions[2],30,120,(255,255,255),font_size=30)
            set_text(instructions[3],30,150,(255,255,255),font_size=30)
            set_text(instructions[4],30,180,(255,255,255),font_size=30)
            set_text(instructions[5],30,210,(255,255,255),font_size=30)
            set_text(instructions[6],30,240,(255,255,255),font_size=30)
            set_text(instructions[7],30,270,(255,255,255),font_size=30)
        set_text("Грати", to_game.rect.x+10, to_game.rect.y+10, (0, 0, 0), font_size=150)
 
        pygame.display.update()
        if to_game.rect.collidepoint(mouse_x, mouse_y):
            to_game.rect.x, to_game.rect.y = 450 - 5, 200 - 5
        else:
            to_game.rect.x, to_game.rect.y = 450, 200
        if ins.rect.collidepoint(mouse_x, mouse_y):
            ins.rect.x, ins.rect.y = 15,15
        else:
            ins.rect.x, ins.rect.y = 20,20
        if close.rect.collidepoint(mouse_x, mouse_y):
            close.rect.x, close.rect.y = 15,15
        else:
            close.rect.x, close.rect.y = 20,20
        if menu.rect.collidepoint(mouse_x,mouse_y):
            menu.rect.x, menu.rect.y = 5,75
        else:
            menu.rect.x, menu.rect.y = 0,80
        pygame.display.update()
        clock.tick(FPS)

    else:
        background.show()
        pause.show()
        heart.show()
        if a >= 10:
            k+=1
            hero.rect.x = 200
            a = 0

        leaf.show()
        leaf.max_frame_count = 30
        leaf.animate_walking()
        leaf.rect.x -= 0.5
        leaf.rect.y += 0.5
        if leaf.rect.y >=100:
            leaf.rect.y = 0
            leaf.rect.x = 0
        
        if show_fire:
            fire_attack()
        if hero.rect.x >= WINDOW_WIDTH-hero.rect.width:
            hero.rect.x = WINDOW_WIDTH - hero.rect.width
        if hero.rect.x <= 0:
            hero.rect.x = 0
        if hero.rect.y <=0:
            hero.rect.y = 0
        if hero.rect.y >= 450:
            hero.rect.y = 450
        if letsgo:
            p+=1
            if p >= 100:
                letsgo = False
                p = 0
            hero.defance([enemy_person])
        if hiding: 
            hide()
        if button_enter.rect.collidepoint(mouse_x, mouse_y):
            button_enter.rect.x, button_enter.rect.y = 1000 - 5, 150 - 5
        else:
            button_enter.rect.x, button_enter.rect.y = 1000, 150
        if set_run:
            run()

        plot()
        hero.update()
        hero.show()
        health_rect.fill()
        menu.show()
        pygame.display.update()
        clock.tick(FPS)

pygame.quit()
