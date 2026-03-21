# ==========================================
# Etapa 1: Construir el Frontend (Tailwind CSS)
# ==========================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copiar configuración de dependencias y de Tailwind
COPY frontend/package*.json ./
COPY frontend/tailwind.config.js ./

# Instalar dependencias (Tailwind)
RUN npm install

# Copiar el resto de archivos del frontend (templates y static)
COPY frontend/ ./

# Generar el archivo estilos.css final de producción
RUN npm run build:css

# ==========================================
# Etapa 2: Aplicación Backend (Python Flask)
# ==========================================
FROM python:3.12-slim

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend
ENV FLASK_ENV=production

# Establecer el directorio de trabajo
WORKDIR /app

# Crear las carpetas de estructura
RUN mkdir -p /app/backend /app/frontend

# Copiar dependencias del backend
COPY backend/requirements.txt /app/backend/

# Actualizar pip e instalar dependencias
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copiar el código fuente de Python
COPY backend/ /app/backend/

# Copiar el frontend ya compilado (con el CSS listo) de la Etapa 1
COPY --from=frontend-builder /app/frontend/ /app/frontend/

# Exponer el puerto por el que escuchará Gunicorn
EXPOSE 5000

# Mover el contexto de trabajo al backend para ejecutar la aplicación
WORKDIR /app/backend

# Iniciar la aplicación en modo producción usando Gunicorn (4 workers)
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "controller:app"]
