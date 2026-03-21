from model import app, db
from sqlalchemy import text

with app.app_context():
    try:
        with db.engine.connect() as conn:
            # Add columns one by one
            try:
                conn.execute(text("ALTER TABLE user ADD COLUMN riot_name VARCHAR(50)"))
                print("Added riot_name")
            except Exception as e: print(f"riot_name error (probably exists): {e}")

            try:
                conn.execute(text("ALTER TABLE user ADD COLUMN riot_tag VARCHAR(10)"))
                print("Added riot_tag")
            except Exception as e: print(f"riot_tag error: {e}")

            try:
                conn.execute(text("ALTER TABLE user ADD COLUMN email VARCHAR(120)"))
                print("Added email")
            except Exception as e: print(f"email error: {e}")
            
            try:
                conn.execute(text("ALTER TABLE user ADD COLUMN profile_picture VARCHAR(200) DEFAULT 'default.png'"))
                print("Added profile_picture")
            except Exception as e: print(f"profile_picture error: {e}")
            
            conn.commit()
            print("Migration completed.")
    except Exception as e:
        print(f"General Error: {e}")
