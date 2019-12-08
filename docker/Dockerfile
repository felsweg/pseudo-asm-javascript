FROM debian:buster-slim
ARG USER_ID=1000
ARG GROUP_ID=1000
ARG USER_NAME=solus
WORKDIR /code
RUN addgroup --gid ${GROUP_ID} ${USER_NAME} && useradd --uid ${USER_ID} --gid ${GROUP_ID} ${USER_NAME} --create-home
RUN apt update && apt upgrade
RUN apt install -y curl
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash - \
    && apt update && apt install -y nodejs
RUN npm install -g ember-cli

CMD ["/bin/bash"]