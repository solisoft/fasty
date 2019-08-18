FROM ubuntu:18.04
LABEL Olivier Bonnaure <olivier@solisoft.net>
RUN apt-get -qq update && apt-get -qqy install vim zlib1g-dev libreadline-dev libncurses5-dev libpcre3-dev libssl-dev gcc perl make curl git-core curl luarocks libsass-dev

ARG OPENRESTY_VERSION=1.15.8.1

RUN wget https://openresty.org/download/openresty-${OPENRESTY_VERSION}.tar.gz \
    && tar xf openresty-${OPENRESTY_VERSION}.tar.gz \
    && cd openresty-${OPENRESTY_VERSION} \
    && ./configure -j2 \
    && make -j2 \
    && make install

RUN luarocks install --server=http://rocks.moonscript.org/manifests/leafo lapis $LAPIS_VERSION
RUN luarocks install moonscript
RUN luarocks install lapis-console
RUN luarocks install stringy
RUN luarocks install busted
RUN luarocks install sass

RUN wget https://raw.githubusercontent.com/visionmedia/n/master/bin/n && \
    chmod +x n && mv n /usr/bin/n && n lts

RUN npm install -g yarn forever

RUN curl -OL https://download.arangodb.com/arangodb34/DEBIAN/Release.key && \
    apt-key add - < Release.key && \
    apt-key add - < Release.key && \
    echo 'deb https://download.arangodb.com/arangodb34/DEBIAN/ /' | tee /etc/apt/sources.list.d/arangodb.list  && \
    apt-get install apt-transport-https && \
    apt-get update && \
    apt-get install arangodb3-client=3.4.7-1

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx