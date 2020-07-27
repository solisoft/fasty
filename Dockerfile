FROM ubuntu:18.04
LABEL Olivier Bonnaure <olivier@solisoft.net>
RUN apt-get -qq update && apt-get -qqy install vim zlib1g-dev libreadline-dev \
    libncurses5-dev libpcre3-dev libssl-dev gcc perl make curl git-core curl \
    luarocks libsass-dev glib2.0-dev libexpat1-dev \
    libjpeg-dev libwebp-dev libpng-dev libexif-dev libgif-dev

RUN wget https://github.com/libvips/libvips/releases/download/v8.9.2/vips-8.9.2.tar.gz \
    && tar -xf vips-8.9.2.tar.gz \
    && cd vips-8.9.2 \
    && ./configure \
    && make && make install && ldconfig

ARG OPENRESTY_VERSION=1.17.8.2

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
RUN luarocks install web_sanitize
RUN luarocks install luasec
RUN luarocks install cloud_storage

RUN wget https://raw.githubusercontent.com/visionmedia/n/master/bin/n && \
    chmod +x n && mv n /usr/bin/n && n lts

RUN npm install -g yarn forever @riotjs/cli

RUN curl -OL https://download.arangodb.com/arangodb35/DEBIAN/Release.key && \
    apt-key add - < Release.key && \
    echo 'deb https://download.arangodb.com/arangodb36/DEBIAN/ /' | tee /etc/apt/sources.list.d/arangodb.list  && \
    apt-get update && \
    apt-get install apt-transport-https && \
    apt-get install arangodb3-client

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx