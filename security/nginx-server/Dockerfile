FROM owasp/modsecurity-crs:nginx

USER root


RUN apt-get update && apt-get install -y \
    curl \
    vim \
    openssl \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/certificates && \
    mkdir -p /var/log/modsecurity && \
    mkdir -p /var/log/nginx && \
    chmod 755 /var/log/modsecurity && \
    chmod 755 /var/log/nginx

RUN git clone https://github.com/coreruleset/coreruleset.git /usr/local/modsecurity-crs && \
    cd /usr/local/modsecurity-crs && \
    cp crs-setup.conf.example crs-setup.conf && \
    mkdir -p rules && \
    cp rules/*.conf /usr/local/modsecurity-crs/rules/ || true

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY entrpoint-cert.sh /usr/local/bin/custom-entrypoint.sh
COPY healthcheck.sh /usr/local/bin/healthcheck.sh
COPY modsecurity/modsecurity.conf /etc/modsecurity/modsecurity.conf

RUN chmod 755 /usr/local/bin/custom-entrypoint.sh && \
    chmod 644 /etc/nginx/nginx.conf && \
    chmod 644 /etc/modsecurity/modsecurity.conf
RUN chmod +x /usr/local/bin/healthcheck.sh

EXPOSE 80 443

HEALTHCHECK CMD ["/usr/local/bin/healthcheck.sh"]
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]