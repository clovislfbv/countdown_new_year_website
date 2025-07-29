FROM php:apache

RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install pytube pytubefix requests spotipy --break-system-packages
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

WORKDIR /var/www/html/

# Fix permissions for www-data user
RUN chown -R www-data:www-data /var/www/html/
RUN chmod -R 755 /var/www/html/

EXPOSE ${port}