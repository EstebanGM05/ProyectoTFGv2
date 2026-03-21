import os
import requests
import pymysql
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

pymysql.install_as_MySQLdb()

import os
import os
from flask_cors import CORS
base_dir = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///league_of_legends.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'mi_clave_secreta_riot'

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    riot_name = db.Column(db.String(50), nullable=True)
    riot_tag = db.Column(db.String(10), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    profile_picture = db.Column(db.String(200), nullable=True, default='default.png')
    favorites = db.relationship('Favorite', backref='user', lazy=True)

class Character(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Riot Key
    name = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(250), nullable=False) # Guardaremos 'Aatrox.png'
    recurso = db.Column(db.String(50), nullable=False)

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    champ_id = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Friend(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    tag = db.Column(db.String(10), nullable=False)
    role = db.Column(db.String(50), nullable=False) # TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
    last_champion = db.Column(db.String(50), nullable=True) # Last champion played


def sync_api_to_db(lang="es_ES"):
    # Guardaremos las imágenes en public/img/champions del frontend de Vite
    img_folder = os.path.join(base_dir, '../frontend/public/img/champions')
    if not os.path.exists(img_folder):
        os.makedirs(img_folder)

    version = requests.get("https://ddragon.leagueoflegends.com/api/versions.json").json()[0]
    url = f"https://ddragon.leagueoflegends.com/cdn/{version}/data/{lang}/champion.json"
    data = requests.get(url).json()["data"]

    for key in data:
        champ = data[key]
        champ_id = int(champ['key'])
        # Usamos imagenes centradas HD en lugar de fijos 120px
        img_name = f"{champ['id']}_centered.jpg"
        
        local_path = os.path.join(img_folder, img_name)
        if not os.path.exists(local_path):
            img_url = f"https://ddragon.leagueoflegends.com/cdn/img/champion/centered/{champ['id']}_0.jpg"
            try:
                response = requests.get(img_url)
                if response.status_code == 200:
                    with open(local_path, 'wb') as f:
                        f.write(response.content)
                else:
                    # Fallback al icono si no hay centered (raro)
                    img_name = f"{champ['id']}.png"
                    img_url = f"https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{img_name}"
                    response = requests.get(img_url)
                    with open(os.path.join(img_folder, img_name), 'wb') as f:
                        f.write(response.content)
            except Exception:
                pass

        pj = Character.query.get(champ_id)
        if pj:
            pj.name = champ['name']
            pj.title = champ['title']
            pj.description = champ['blurb']
            pj.role = ", ".join(champ['tags'])
            pj.recurso = champ['partype']
            pj.image_url = img_name
        else:
            nuevo_pj = Character(
                id=champ_id,
                name=champ['name'],
                title=champ['title'],
                description=champ['blurb'],
                role=", ".join(champ['tags']),
                image_url=img_name,
                recurso=champ['partype']
            )
            db.session.add(nuevo_pj)

    db.session.commit()

with app.app_context():
    db.create_all()