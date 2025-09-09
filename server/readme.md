# Matflow Backend

This is a Django project that receives API requests with/without Celery, and sends responses.

## Getting Started
To run this project with **Python 3.10** and **Celery**, follow these steps:

---

## 1. Prerequisites
Ensure the following are installed on your system:
- **Python 3.10**
- **Redis** (as the Celery broker)
- **Django**
- **Celery**

---

## 2. Verify Python Installation
Ensure Python 3.10 is installed:

```bash
python3 --version
```
If not installed, download and install it from the [official Python website](https://www.python.org/).

---

## 3. Setup Virtual Environment
Create a virtual environment using Python 3.10:

```bash
python3.10 -m venv env
```
Activate the virtual environment:

- On macOS/Linux:
  ```bash
  source env/bin/activate
  ```
- On Windows:
  ```bash
  .\env\Scripts\activate
  ```

---

## 4. Clone the Repository
Clone the project repository:

```bash
git clone https://github.com/ml-cou/Matflow-nodebased-backend.git
```
Navigate into the project directory:

```bash
cd Matflow-nodebased-backend
```

---

## 5. Install Required Packages
Install dependencies from the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

---

## 6. Start Redis
Make sure Redis is running on the default port **localhost:6379**.

- To start Redis (Linux/Mac):
  ```bash
  redis-server
  ```
- For Windows, download Redis from [Redis for Windows](https://github.com/microsoftarchive/redis) and run the server.

---

## 7. Apply Database Migrations
Run the Django database migrations:

```bash
python manage.py migrate
```

---

## 8. Start Django Development Server
Run the Django development server:

```bash
python manage.py runserver
```
The server will now be available at:

```
http://localhost:8000/
```

---

## 9. Start Celery Worker
Run the Celery worker to handle background tasks:

```bash
celery -A Matflow worker -l info --pool=solo
```

```bash
celery -A Matflow control shutdown
```

```bash
celery -A Matflow purge
```
---

## 🎉 Ready to Go!
