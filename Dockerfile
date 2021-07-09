FROM ubuntu:18.04
LABEL Olivier Bonnaure <olivier@solisoft.net>
RUN apt-get -qq update && apt-get -qqy install vim zlib1g-dev libreadline-dev \
    libncurses5-dev libpcre3-dev libssl-dev gcc perl make git-core \
    libsass-dev glib2.0-dev libexpat1-dev \
    libjpeg-dev libwebp-dev libpng-dev libexif-dev libgif-dev wget

ARG VIPS_VERSION=8.11.1

RUN wget https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.gz \
    && tar -xf vips-${VIPS_VERSION}.tar.gz \
    && cd vips-${VIPS_VERSION} \
    && ./configure \
    && make && make install && ldconfig && cd .. && rm -Rf vips-*

ARG OPENRESTY_VERSION=1.19.3.2

RUN wget https://openresty.org/download/openresty-${OPENRESTY_VERSION}.tar.gz \
    && tar xf openresty-${OPENRESTY_VERSION}.tar.gz \
    && cd openresty-${OPENRESTY_VERSION} \
    && ./configure -j2 \
    && make -j2 \
    && make install && cd .. && rm -Rf openresty-*

ARG LUAROCKS_VERSION=3.5.0

RUN apt-get -qqy install lua5.1 liblua5.1-0-dev unzip zip

RUN wget https://luarocks.org/releases/luarocks-${LUAROCKS_VERSION}.tar.gz \
    && tar zxpf luarocks-${LUAROCKS_VERSION}.tar.gz \
    && cd luarocks-${LUAROCKS_VERSION} \
    && ./configure && make \
    && make install && cd .. && rm -Rf luarocks-*

ARG LAPIS_VERSION=1.8.3
RUN luarocks install --server=http://rocks.moonscript.org/manifests/leafo lapis $LAPIS_VERSION
RUN luarocks install moonscript
RUN luarocks install lapis-console
RUN luarocks install stringy
RUN luarocks install busted
RUN luarocks install sass
RUN luarocks install web_sanitize
RUN luarocks install luasec
RUN luarocks install cloud_storage
RUN luarocks install lua-resty-jwt
RUN apt-get -qqy install libyaml-dev
RUN luarocks --server=http://rocks.moonscript.org install lyaml

RUN wget https://raw.githubusercontent.com/visionmedia/n/master/bin/n && \
    chmod +x n && mv n /usr/bin/n && n lts

#RUN wget https://download.arangodb.com/arangodb37/DEBIAN/Release.key && \
#    apt-key add - < Release.key && \
#    echo 'deb https://download.arangodb.com/arangodb37/DEBIAN/ /' | tee /etc/apt/sources.list.d/arangodb.list  && \
#    apt-get update && \
#    apt-get install apt-transport-https && \
#    apt-get install arangodb3-client

RUN npm install -g yarn forever @riotjs/cli terser tailwindcss autoprefixer postcss

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx