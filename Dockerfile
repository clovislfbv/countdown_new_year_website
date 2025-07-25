FROM php:apache

RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install pytube --break-system-packages
RUN pip3 install pytubefix --break-system-packages
RUN pip3 install requests --break-system-packages
RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

WORKDIR /var/www/html/

# Create downloads directory with proper permissions
RUN mkdir -p /var/www/html/downloads
RUN chown -R www-data:www-data /var/www/html/
RUN chmod -R 755 /var/www/html/

EXPOSE 80