FROM ubuntu:20.04
LABEL Olivier Bonnaure <olivier@solisoft.net>
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -qq update && apt-get -qqy install vim zlib1g-dev libreadline-dev \
    libncurses5-dev libpcre3-dev libssl-dev gcc perl make git-core \
    libsass-dev glib2.0-dev libexpat1-dev \
    libjpeg-dev libwebp-dev libpng-dev libexif-dev libgif-dev wget \
    libx265-dev libde265-dev libheif-dev autoconf cmake build-essential

ARG VIPS_VERSION=8.12.2

RUN wget https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.gz \
    && tar -xf vips-${VIPS_VERSION}.tar.gz \
    && cd vips-${VIPS_VERSION} \
    && ./configure \
    && make && make install && ldconfig && cd .. && rm -Rf vips-*

ARG OPENRESTY_VERSION=1.19.9.1

RUN wget https://openresty.org/download/openresty-${OPENRESTY_VERSION}.tar.gz \
    && tar xf openresty-${OPENRESTY_VERSION}.tar.gz \
    && cd openresty-${OPENRESTY_VERSION} \
    && ./configure -j2 \
    && make -j2 \
    && make install && cd .. && rm -Rf openresty-*

ARG LUAROCKS_VERSION=3.8.0

RUN apt-get -qqy install lua5.1 liblua5.1-0-dev unzip zip

RUN wget https://luarocks.org/releases/luarocks-${LUAROCKS_VERSION}.tar.gz \
    && tar zxpf luarocks-${LUAROCKS_VERSION}.tar.gz \
    && cd luarocks-${LUAROCKS_VERSION} \
    && ./configure && make \
    && make install && cd .. && rm -Rf luarocks-*

ARG LAPIS_VERSION=1.9.0
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
RUN luarocks install fun
RUN apt-get -qqy install libyaml-dev
RUN luarocks --server=http://rocks.moonscript.org install lyaml

RUN wget https://raw.githubusercontent.com/visionmedia/n/master/bin/n && \
    chmod +x n && mv n /usr/bin/n && n lts

RUN wget https://download.arangodb.com/arangodb38/DEBIAN/Release.key && \
    apt-key add - < Release.key && \
    echo 'deb https://download.arangodb.com/arangodb38/DEBIAN/ /' | tee /etc/apt/sources.list.d/arangodb.list  && \
    apt-get update && \
    apt-get install apt-transport-https && \
    apt-get install arangodb3-client

RUN npm install -g yarn@1.22.11 \
    forever@4.0.1 \
    @riotjs/cli@6.0.5 \
    @babel/core@7.15.5 \
    terser@5.7.2 \
    tailwindcss@3.0.23 \
    autoprefixer@10.3.4 \
    postcss@8.3.6

RUN wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox_0.12.6-1.focal_amd64.deb
RUN apt-get -qqy install ./wkhtmltox_0.12.6-1.focal_amd64.deb
RUN rm wkhtmltox_0.12.6-1.focal_amd64.deb

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx
