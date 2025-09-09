# Matflow Backend

This is a Django project that receives API requests with/without Celery, and sends responses.

---

## 1. Prerequisites

Ensure the following are installed on your system:

* **Conda (Miniconda or Anaconda)**
* **Redis** (as the Celery broker)

---

## 2. Create Conda Environment

Create the environment from the provided `environment.yml`:

```bash
conda env create -f environment.yml
```

Activate the environment:

```bash
conda activate server
```

If you update the YAML later, sync your env with:

```bash
conda env update -f environment.yml --prune
```

---

## 3. Clone the Repository

Clone the project repository:

```bash
git clone https://github.com/ml-cou/Matflow-nodebased-backend.git
cd Matflow-nodebased-backend
```

---

## 4. Start Redis

Make sure Redis is running on the default port **localhost:6379**.

* On Linux/macOS:

  ```bash
  redis-server
  ```
* On Windows, install Redis from [Redis for Windows](https://github.com/microsoftarchive/redis).

---

## 5. Apply Database Migrations

Run the Django database migrations:

```bash
python manage.py migrate
```

---

## 6. Start Django Development Server

Run the Django development server:

```bash
python manage.py runserver
```

The server will now be available at:

```
http://localhost:8000/
```

---

## 7. Start Celery Worker

Run the Celery worker to handle background tasks:

```bash
celery -A Matflow worker -l info --pool=solo
```

Other useful commands:

```bash
celery -A Matflow control shutdown
celery -A Matflow purge
```

---

## 🎉 Ready to Go!
