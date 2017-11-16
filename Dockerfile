FROM debian:jessie
MAINTAINER Aku Rouhe "aku.rouhe@aalto.fi"
RUN apt-get update -y && apt-get install -y \
  build-essential \
  python \
  python-dev \
  python-pip && \
  apt-get clean autoclean && \
  apt-get autoremove -y 

WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt
ENV FLASK_APP=routing.py
ENTRYPOINT ["python", "-m", "flask", "run", "--host=0.0.0.0"]
