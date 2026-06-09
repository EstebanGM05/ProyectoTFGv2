# ==========================================
# Etapa 1: Construir el Frontend (React + Vite)
# ==========================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copiar archivos de configuración del frontend
COPY frontend/package*.json ./
COPY frontend/tailwind.config.js ./
COPY frontend/vite.config.ts ./
COPY frontend/tsconfig*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el resto del código fuente del frontend
COPY frontend/ ./

# Generar la versión estática de producción (carpeta 'dist')
RUN npm run build

# ==========================================
# Etapa 2: Aplicación Backend (Python Flask)
# ==========================================
FROM python:3.12-slim

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Instalar utilidades del sistema necesarias (gcc, sqlite)
RUN apt-get update && apt-get install -y gcc sqlite3 && rm -rf /var/lib/apt/lists/*

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar dependencias del backend
COPY backend/requirements.txt /app/backend/

# Actualizar pip e instalar dependencias (+ gunicorn para producción)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt gunicorn

# Copiar el código fuente de Python
COPY backend/ /app/backend/

# Crear la carpeta static si no existe y copiar los archivos compilados del frontend
# Esto permite que Flask sirva la web sin necesidad de Nginx
RUN mkdir -p /app/backend/static
COPY --from=frontend-builder /app/frontend/dist/ /app/backend/static/

# Exponer el puerto por el que escuchará Gunicorn (interno del contenedor)
EXPOSE 5000

# Mover el contexto de trabajo al backend para ejecutar la aplicación
WORKDIR /app/backend

# Iniciar la aplicación en modo producción usando Gunicorn (4 workers)
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "controller:app"]
