FROM python:3.12

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install Pillow==10.1.0
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    libpq-dev \
    libjpeg-dev \
    libpng-dev \
	gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install Pillow==10.1.0
RUN pip install python-dotenv
RUN pip install channels==4.0.0
RUN pip install channels-redis==4.1.0
RUN pip install daphne

# Créer les répertoires nécessaires

COPY backend/ .

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]

