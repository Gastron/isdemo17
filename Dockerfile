FROM debian:jessie
MAINTAINER Aku Rouhe "aku.rouhe@aalto.fi"
RUN apt-get update -y
RUN apt-get install -y python python-pip python-dev build-essential
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
ENV FLASK_APP=routing.py
ENTRYPOINT ["python", "-m", "flask", "run", "--host=0.0.0.0"]
