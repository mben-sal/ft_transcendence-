#!/bin/bash

#-------------------------------------------------------------
#---- Check if Nginx is up and responding to HTTP requests ---
if curl -f http://10.12.9.8/ > /dev/null 2>&1; then
    echo "Nginx is up and running."
    exit 0
else
    echo "Nginx is not responding!"
    exit 1
fi
#-------------------------------------------------------------
