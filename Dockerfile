FROM ubuntu:18.04
LABEL Olivier Bonnaure <olivier@solisoft.net>
RUN apt-get -qq update && apt-get -qqy install vim zlib1g-dev libreadline-dev libncurses5-dev libpcre3-dev libssl-dev gcc perl make curl git-core curl luarocks libsass-dev glib2.0-dev libexpat1-dev

ARG OPENRESTY_VERSION=1.15.8.2
ARG LIBVIPS_VERSION=8.9.1

RUN wget https://openresty.org/download/openresty-${OPENRESTY_VERSION}.tar.gz \
    && tar xf openresty-${OPENRESTY_VERSION}.tar.gz \
    && cd openresty-${OPENRESTY_VERSION} \
    && ./configure -j2 \
    && make -j2 \
    && make install

RUN wget https://github.com/libvips/libvips/releases/download/v${LIBVIPS_VERSION}/vips-8.9.1.tar.gz \
    && tar -xf vips-${LIBVIPS_VERSION}.tar.gz \
    && cd vips-${LIBVIPS_VERSION} \
    && ./configure \
    && make && make install && ldconfig

RUN luarocks install --server=http://rocks.moonscript.org/manifests/leafo lapis $LAPIS_VERSION
RUN luarocks install moonscript
RUN luarocks install lapis-console
RUN luarocks install stringy
RUN luarocks install busted
RUN luarocks install sass
RUN luarocks install lua-vips

RUN wget https://raw.githubusercontent.com/visionmedia/n/master/bin/n && \
    chmod +x n && mv n /usr/bin/n && n lts

RUN npm install -g yarn forever

RUN curl -OL https://download.arangodb.com/arangodb35/DEBIAN/Release.key && \
    apt-key add - < Release.key && \
    echo 'deb https://download.arangodb.com/arangodb35/DEBIAN/ /' | tee /etc/apt/sources.list.d/arangodb.list  && \
    apt-get update && \
    apt-get install apt-transport-https && \
    apt-get install arangodb3-client=3.5.3-1

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx