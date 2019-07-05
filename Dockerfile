FROM ubuntu:18.04
LABEL Olivier Bonnaure <olivier@solisoft.net>


RUN apt-get -qq update && apt-get -qqy install zlib1g-dev libreadline-dev libncurses5-dev libpcre3-dev libssl-dev gcc perl make curl git-core curl luarocks libsass-dev

RUN wget https://openresty.org/download/openresty-1.15.8.1.tar.gz \
    && tar xf openresty-1.15.8.1.tar.gz \
    && cd openresty-1.15.8.1 \
    && ./configure -j2 \
    && make -j2 \
    && make install

RUN luarocks install --server=http://rocks.moonscript.org/manifests/leafo lapis $LAPIS_VERSION
RUN luarocks install moonscript
RUN luarocks install lapis-console
RUN luarocks install stringy
RUN luarocks install busted
RUN luarocks install sass

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx