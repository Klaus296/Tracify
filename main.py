import pygame
from random import randint
from pygame import *
from texts import*
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
        self.circle = Picture("picture/circle.png", 0, 0, 150, 150)
        self.speed = 5
        self.jump_speed = -10
        self.gravity = 0.5
        self.y_velocity = 0
        self.on_ground = False
        self.ground_level = y
        self.direction = "right"
        self.dop_speed = 100
        self.damage = 1
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
        if self.colliderect(enemy):
            enemy_health.rect.width -= self.damage
        fr+=1
        if fr >= 10:
            self.rect.x = enemy.rect.x
            if fr >=15:
                self.rect.x = randint(200, WINDOW_WIDTH - 200)
                frame = 0
    def defance(self, enemys):
        global health_rect
        self.healing = 0.2
        for enemy in enemys:
            if self.colliderect(enemy):
                health_rect.rect.width += 10
        
        seijiro_health.rect.width+=self.healing
        self.circle.show()
        
        self.circle.rect.x = self.rect.x-10
        self.circle.rect.y = self.rect.y-10
    def animate_walking(self):
        self.frame_count += 1
        if self.frame_count >= 8:
            self.current_frame = (self.current_frame + 1) % len(self.walk_right_frames)
            if self.direction == "right":
                self.image = self.walk_right_frames[self.current_frame]
            else:
                self.image = self.walk_left_frames[self.current_frame]
            self.frame_count = 0

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
falling_bones = []
def set_text(text, x, y, color=(255, 255, 255), font_size=30):
    font = pygame.font.Font(None, font_size)
    text_surface = font.render(text, True, color)
    window.blit(text_surface, (x, y))
frame_lose = 0
def window_lose():
    window.fill((0, 0, 0))
    set_text("Ти програв! Зараз ти повернешся до гри\n і почнеш знову.", 500, 300, (255, 0, 0), font_size=50)

def falling_bones_attack(hero):
    global falling_bones, health_rect,seijiro
    seijiro.rect.y = 100
    if not falling_bones:
        falling_bones = [Picture("picture/fire.png", randint(0, WINDOW_WIDTH - 50), randint(-600, -50), 50, 50) for _ in range(20)]
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
    global hero,keys
    keys = pygame.key.get_pressed()
    hero.is_moving = False

    if keys[K_RIGHT]:
        hero.rect.x += hero.speed
        hero.is_moving = True
        hero.direction = "right"
    elif keys[K_LEFT]:
        hero.rect.x -= hero.speed
        hero.is_moving = True
        hero.direction = "left"

    if keys[K_SPACE] and hero.on_ground:
        hero.y_velocity = hero.jump_speed
        hero.on_ground = False
e = 0
switch = "start"
def show_text(active_text, x, y, color=(255, 255, 255), font_size=30, show_items=[], back=None):
    global button_enter, quad, e, k

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
    button_enter = Area(1000, 150, 100, 50, (30, 0, 0))
    quad.fill()
    button_enter.fill()
    text_surface = font.render(active_text[e], True, color)
    txt_enter = font.render("Enter", True, (255, 255, 255))

    window.blit(text_surface, (x + 10, y + 10))
    window.blit(txt_enter, (button_enter.rect.x + 10, button_enter.rect.y + 10))

i = 0
def start():
    global i,k
    farian.show()
    farian.direction = "left"
    farian.animate_walking()
    farian.rect.x -= 5
    i+=1
    if i >= 90:
        k+=1
portal = Picture("picture/portal.png", WINDOW_WIDTH-220, WINDOW_HEIGHT-300, 200, 250)
def end():
    global portal, k   
    portal.show()
    if hero.colliderect(portal):
        k+=1
        hero.rect.x = WINDOW_WIDTH/2 - hero.rect.width
frame = 0
n = 0
btn = Picture("picture/btn.png", 800, WINDOW_HEIGHT-50, 50, 50)
def first_exam():
    global frame, k, hero, background,btn, n
    global background
    btn.show()
    background = Picture('picture/2.png', 0, 0, 1200, 600)
    hero.speed = 12
    frame+=1
    if frame >= 90 or hero.colliderect(btn):
        n+=1
        btn.rect.x = randint(200, 1000)
        frame = 0
    if n>=10:
        k+=1
fire = Picture("picture/fire.png", 500, WINDOW_HEIGHT, 50, 50)
def the_case():
    global k, frame, hero, case,fire
    hero.speed = 5
    global case, k
    case = Hero(frames=[[],["picture/case_1.png","picture/case_2.png"]], x=WINDOW_WIDTH-150, y=WINDOW_HEIGHT-70, width=100, height=100)
    case.show()
    case.animate_standing()
    if hero.colliderect(case):
        fire.show()
        hero.speed = 0
        fire.rect.y-=1
        frame+=1
        if frame >= 150:
            k+=1

def second_exam():
    global frame, k, hero, platforms, max_platforms, platform_spawn_rate,background
    background = Picture('picture/3.png', 0, 0, 1200, 600)
    hero.speed = 5
    seijiro.damage = 1.5
    # Initialize variables for platforms
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
seijiro = Hero(frames=seijirou_frame, x=-200, y=WINDOW_HEIGHT-150, width=100, height=110)
fr = 0
def in_water_town():
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
def first_fight():
    global k, seijiro, frame, hero, rand, seijiro_health, keys,m,circle,enemy_person, enemy_health,WINDOW_HEIGHT,frame_lose
    enemy_health = seijiro_health
    enemy_person = seijiro
    seijiro_health.fill()
    seijiro.show()
    frame += 1
    if m==0:
        seijiro.defance([hero])
    if m==1:
        falling_bones_attack(hero)
    if m==2:
        seijiro.shadow(hero, health_rect)
    if m!=0:
        seijiro.rect.y=WINDOW_HEIGHT-150
    if frame >= 90:
        frame = 0
        m = randint(0, 2)
    if hero.rect.x >= seijiro.rect.x:
        seijiro.direction = "left"
    elif hero.rect.x < seijiro.rect.x:
        seijiro.direction = "right"
    seijiro.animate_walking()
    if hero.colliderect(seijiro):
        rand = randint(200, WINDOW_WIDTH - 200)
        seijiro.rect.x = rand
    if health_rect.rect.width <= 0:        
        frame_lose += 1
        window_lose()
        if frame_lose >= 100:
            health_rect.rect.width = 200
            seijiro_health.rect.width = 200
            frame_lose = 0

    if seijiro_health.rect.width <= 0:
        k += 1
        seijiro_health.rect.width = 200
        health_rect.rect.width = 200
        print("You win!")
def second_fight():
    global k, seijiro, frame, hero, rand, seijiro_health, keys,m,circle,enemy_person, enemy_health,WINDOW_HEIGHT,frame_lose
    enemy_health = seijiro_health
    enemy_person = seijiro
    seijiro_health.fill()
    seijiro.show()
    frame += 1
    if m==0:
        seijiro.defance([hero])
    if m==1:
        falling_bones_attack(hero)
    if m==2:
        seijiro.shadow(hero, health_rect)
    if m!=0:
        seijiro.rect.y=WINDOW_HEIGHT-150
    if frame >= 90:
        frame = 0
        m = randint(0, 2)
    if hero.rect.x >= seijiro.rect.x:
        seijiro.direction = "left"
    elif hero.rect.x < seijiro.rect.x:
        seijiro.direction = "right"
    seijiro.animate_walking()
    if hero.colliderect(seijiro):
        rand = randint(200, WINDOW_WIDTH - 200)
        seijiro.rect.x = rand
    if health_rect.rect.width <= 0:        
        frame_lose += 1
        window_lose()
        if frame_lose >= 100:
            health_rect.rect.width = 200
            seijiro_health.rect.width = 200
            frame_lose = 0
    if seijiro_health.rect.width <= 0:
        k += 1
        seijiro_health.rect.width = 200
        health_rect.rect.width = 200
def after_fight():
    global k, hero, WINDOW_WIDTH,portal
    portal.show()
    if hero.colliderect(portal):
        k += 1
        hero.rect.x = WINDOW_WIDTH/2 - hero.rect.width
needle = Picture("picture/needle.png", 0, 0, 50, 400)
switch2 = "start"
s = 0
a = 0
def in_his_town():
    global k, hero,s,background, needle, switch2,a,temarius
    background = Picture('picture/4.png', 0, 0, 1200, 600)
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
temarius = Hero(frames=temarius_frame, x=WINDOW_WIDTH-200, y=WINDOW_HEIGHT-150, width=100, height=110)
temarius_health = Area(0, 0, 200, 20, (255, 0, 0))
fight_frame = 0
gate = Picture("picture/gate.png", 0, 0, 200, 200)
def temarius_fight():
    global k, temarius, fight_frame, hero, rand, temarius_health, keys,m,circle,enemy_person, enemy_health,WINDOW_HEIGHT
    temarius.animate_walking()
    temarius_health.fill()
    temarius.show()
    
    if frame <=70:
        hero.direction = "right"
        temarius.direction = "left"
        
    fight_frame+=1
    if fight_frame >= 70:
        fire_attack(temarius, temarius_health)
    if fight_frame >=150:
        temarius.rect.x = hero.rect.x-100
        health_rect.rect.width -= 50
        gate.show()
        gate.rect.x = hero.rect.x-100
        gate.rect.y = hero.rect.y-100
    if fight_frame >= 165:
        temarius.rect.x = WINDOW_WIDTH-200
        k+=1
        fight_frame = 0
        # Не забудь додати текст розмови
def temarius_fight2():
    global k, temarius, fight_frame, hero, rand, temarius_health, keys,m,circle,enemy_person, enemy_health,WINDOW_HEIGHT
    enemy_health = temarius_health
    enemy_person = temarius
    temarius_health.fill()
    temarius.show()
    fight_frame += 1
    if fight_frame <=20:
        gate.show()
    if fight_frame >= 20:
        hero.defance([enemy_person])
        hero.direction = "right"
        hero.animate_walking()
        hero.rect.x += 3
    if fight_frame >= 50:
        needle.show()
        needle.rect.x = 400
        needle.rect.y = 400
    



    


    
plot_list = [lambda:start(),lambda:show_text(first_text, 10, 10, font_size=30, show_items=[farian]),lambda:end(),lambda:first_exam(), lambda:the_case(),
             lambda:second_exam(), lambda:in_water_town(), lambda:first_fight(),lambda:second_fight(),lambda:after_fight(),lambda:in_his_town(),
             lambda:temarius_fight(),lambda:temarius_fight2(),
             ]
k = 0
def plot():
    global k, url, background, hero, plot_list, e, quad
    plot_list[k]()
# Ініціалізація
pygame.init()
clock = pygame.time.Clock()
FPS = 60


url = "picture/1.png"
background = Picture(url, 0, 0, 1200, 600)
health_rect = Area(WINDOW_WIDTH-220,10, 200, 20, (255, 0, 0))
hero = Hero(frames= hero_frame,x=200, y=450, width=100, height=110)
farian = Hero(frames=farian_frame, x=1000, y=450, width=100, height=110)
def fire_attack(enemy,health):
    global fire, switch,show_fire
    fire.show()
    if switch == "start":
        fire.rect.x = hero.rect.x-10
        fire.rect.y = hero.rect.y-10
        switch = "stop"
    if switch == "stop":
        if hero.direction == "right":
            fire.rect.x += 10
        if hero.direction == "left":
            fire.rect.x -= 10
    if fire.rect.x > WINDOW_WIDTH or fire.rect.x < 0:
        show_fire = False
        switch = "start"
    if fire.colliderect(enemy):
        health.rect.width -= 2
def hide():
    global hero,hiding
    if hero.direction == "right":
        hero.rect.x += hero.dop_speed
    if hero.direction == "left":
        hero.rect.x -= hero.dop_speed
    hiding = False

running = True
show_fire = False
letsgo = False
hiding = False
p = 0
enemy_person = seijiro
enemy_health = seijiro_health

while running:
    background.show()
    if a >= 10:
        k+=1
        hero.rect.x = 200
        a = 0
    mouse_x, mouse_y = pygame.mouse.get_pos()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                if button_enter.rect.collidepoint(mouse_x, mouse_y):
                    e += 1  # переконайся, що e оголошено

        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_f:
                show_fire = True
            elif event.key == pygame.K_g:
                letsgo = True
            elif event.key == pygame.K_h:
                hiding = True
    if show_fire:
        fire_attack(enemy_person, enemy_health)

    if letsgo:
        p+=1
        if p >= 100:
            letsgo = False
            p = 0
        hero.defance([enemy_person])
    if hiding: 
        hide()
    run()
    plot()
    hero.update()
    hero.show()
    health_rect.fill()

    pygame.display.update()
    clock.tick(FPS)

pygame.quit()
