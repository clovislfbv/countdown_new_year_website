FROM php:apache

RUN apt-get update && apt-get install -y python3 python3-pip python3.13-venv ffmpeg git
RUN python3 -m venv /opt/venv
RUN /opt/venv/bin/pip install --upgrade pip
RUN /opt/venv/bin/pip install pytube pytubefix requests spotipy spotapi pymongo websockets git+https://github.com/TzurSoffer/spotify-downloader
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

RUN mkdir -p /tmp/spotdl/.config /tmp/spotdl/.cache && chmod -R 777 /tmp/spotdl

ENV HOME=/tmp/spotdl
ENV XDG_CONFIG_HOME=/tmp/spotdl/.config
ENV XDG_CACHE_HOME=/tmp/spotdl/.cache
ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /var/www/html/

RUN chown -R www-data:www-data /var/www/html/
RUN chmod -R 755 /var/www/html/

CMD ["sh", "-lc", "mkdir -p /var/www/html/downloads /tmp/spotdl/.config /tmp/spotdl/.cache && /opt/venv/bin/python /var/www/html/ws_song_events.py >/dev/null 2>&1 & exec apache2-foreground"]

EXPOSE ${port}