FROM gitpod/workspace-full:latest

RUN bash -c ". .nvm/nvm.sh \
    && nvm install 15 \
    && nvm use 15 \
    && nvm alias default 15"

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix