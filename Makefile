# up:
# 	docker compose up --build

# down:
# 	docker compose -f down

# clean: down
# 	docker system prune -af


build:
	@docker-compose -f docker-compose.yml up -d --build



down:
	@docker-compose -f docker-compose.yml down



re: down
	@docker-compose -f docker-compose.yml up -d

clean: down
	@docker system prune -a

fclean:
	@echo "All data will be deleted! Are you sure (yes/no)"
	@read ans && [ "$$ans" = "yes" ] && \
		docker stop $$(docker ps -qa) && \
		docker system prune --all --force --volumes && \
		docker network prune --force && \
		docker volume prune --force || echo "The operation has been cancelled"

run:
		echo "Running default services..."; \
		docker-compose -f docker-compose.yml up --build -d; \

.PHONY : all build down re clean fclean run