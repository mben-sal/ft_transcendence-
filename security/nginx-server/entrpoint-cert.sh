#!/bin/bash

#-----------------------------------------------------------------------------------
#---- Set -e to exit immediately if any command exits with a non-zero status -------
set -e
echo -e "\033[1;32mStarting custom entrypoint\033[0m"
#-----------------------------------------------------------------------------------
#---- Check if the default configuration files exist, and remove them if they do ---
#---- This is done to avoid conflicts with any default configuration that might exist
if [ -f /etc/nginx/conf.d/default.conf ] && [ -f /etc/nginx/conf.d/default.conf.bak ]; then
    rm -f /etc/nginx/conf.d/default.conf
    rm -f /etc/nginx/conf.d/default.conf.bak
    echo -e "\033[1;33mRemoved old default config files\033[0m"
fi
#-----------------------------------------------------------------------------------
#---- Check if SSL certificates exist, and generate them if they do not ------------
#---- SSL certificates are necessary for HTTPS communication -----------------------
if [ ! -f /etc/nginx/certificates/cert.pem ] || [ ! -f /etc/nginx/certificates/privkey.pem ]; then
    echo -e "\033[1;34mGenerating SSL certificates...\033[0m"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certificates/privkey.pem \
        -out /etc/nginx/certificates/cert.pem \
        -subj "/C=MA/ST=Beni Mellal/L=Khouribga/O=Organization/OU=Department/CN=localhost"
    echo -e "\033[1;32mSSL certificates generated successfully.\033[0m"
else
    echo -e "\033[1;32mSSL certificates already exist, skipping generation.\033[0m"
fi
#-----------------------------------------------------------------------------------
#---- Check if Nginx is up and running by sending a request to localhost -----------
#---- This ensures that Nginx is functioning properly after startup ----------------
echo -e "\033[1;34mLaunching Nginx\033[0m"
exec nginx -g "daemon off;"
#-----------------------------------------------------------------------------------
