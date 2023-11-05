FROM ubuntu:20.04
LABEL Olivier Bonnaure <olivier@solisoft.net>
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -qq update && apt-get -qqy install vim zlib1g-dev libreadline-dev \
    libncurses5-dev libpcre3-dev libssl-dev gcc perl make git-core \
    libsass-dev glib2.0-dev libexpat1-dev \
    libjpeg-dev libwebp-dev libpng-dev libexif-dev libgif-dev wget \
    libx265-dev libde265-dev libheif-dev build-essential pkg-config libglib2.0-dev python3-pip libgirepository1.0-dev

RUN pip3 install --user meson
RUN pip3 install --user ninja

RUN mv ~/.local/bin/meson /usr/bin/meson
RUN mv ~/.local/bin/ninja /usr/bin/ninja

ARG VIPS_VERSION=8.14.5

RUN wget https://github.com/libvips/libvips/archive/refs/tags/v${VIPS_VERSION}.tar.gz \
    && tar -xf v${VIPS_VERSION}.tar.gz \
    && cd libvips-${VIPS_VERSION} \
    && meson build \
    && cd build \
    && meson compile \
    && meson test \
    && meson install

RUN rm -Rf libvips-${VIPS_VERSION}

ARG OPENRESTY_VERSION=1.21.4.2

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

ARG LAPIS_VERSION=1.16.0
RUN luarocks install --server=http://rocks.moonscript.org/manifests/leafo lapis $LAPIS_VERSION
RUN luarocks install moonscript
RUN luarocks install lapis-console
RUN luarocks install stringy
RUN luarocks install busted
RUN luarocks install sass
RUN luarocks install web_sanitize
RUN luarocks install luasec
RUN luarocks install luaexpat 1.4.1-1
RUN luarocks install cloud_storage
RUN luarocks install lua-resty-jwt
RUN luarocks install fun
RUN apt-get -qqy install libyaml-dev
RUN luarocks --server=http://rocks.moonscript.org install lyaml

RUN wget https://raw.githubusercontent.com/visionmedia/n/master/bin/n && \
    chmod +x n && mv n /usr/bin/n && n lts

RUN npm install -g yarn@1.22.11 \
    forever@4.0.1 \
    @riotjs/cli@6.0.5 \
    @babel/core@7.15.5 \
    terser@5.7.2 \
    tailwindcss@3.3.2 \
    autoprefixer@10.3.4 \
    postcss@8.3.6

RUN wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox_0.12.6-1.focal_amd64.deb
RUN apt-get -qqy install ./wkhtmltox_0.12.6-1.focal_amd64.deb
RUN rm wkhtmltox_0.12.6-1.focal_amd64.deb

RUN wget https://download.arangodb.com/arangodb310/Community/Linux/arangodb3-client_3.10.2-1_amd64.deb
RUN apt-get -qqy install ./arangodb3-client_3.10.2-1_amd64.deb
RUN rm arangodb3-client_3.10.2-1_amd64.deb

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx
