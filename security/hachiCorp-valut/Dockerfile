FROM hashicorp/vault:1.15

USER root
RUN apk add --no-cache jq curl

COPY entrpoint-init.sh /usr/local/bin/entrpoint-init.sh
RUN chmod +x /usr/local/bin/entrpoint-init.sh

USER vault
ENTRYPOINT ["/usr/local/bin/entrpoint-init.sh"]