FROM postgres:13

RUN apt-get update && \
    apt-get install -y curl jq unzip && \
    curl -Lo vault.zip https://releases.hashicorp.com/vault/1.14.0/vault_1.14.0_linux_amd64.zip && \
    unzip vault.zip && mv vault /usr/local/bin/ && rm vault.zip

COPY entrpoint-db.sh /usr/local/bin/entrpoint-db.sh
COPY healthcheck.sh /usr/local/bin/healthcheck.sh

RUN chmod +x /usr/local/bin/entrpoint-db.sh
RUN chmod +x /usr/local/bin/healthcheck.sh


HEALTHCHECK CMD ["/usr/local/bin/healthcheck.sh"]
ENTRYPOINT ["/usr/local/bin/entrpoint-db.sh"]

CMD ["postgres"]
