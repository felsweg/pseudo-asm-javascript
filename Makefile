start:
	@docker run -d --rm -v $(PWD)/src:/code -u $(shell id -u $(USER)):$(shell id -g $(USER)) -p 4200:4200 emberjs ember serve > pid
	@printf "App started and serving at http://localhost:4200\n"

stop: pid
	@docker stop $(shell cat pid)
	@rm pid

restart: stop start

login: pid
	@docker exec -ti -w /code $(shell cat pid) /bin/bash

log: pid
	@docker logs $(shell cat pid)


install.ember:
	@docker build -f $(PWD)/docker/Dockerfile --build-arg USER_ID=$(shell id -u $(USER)) --build-arg GROUP_ID=$(shell id -g $(USER)) --build-arg USER_NAME=$(USER) -t emberjs . 

