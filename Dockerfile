FROM ubuntu:18.04
LABEL Olivier Bonnaure <olivier@solisoft.net>

# install build dependencies
RUN apt-get -qq update && apt-get install -qqy wget gnupg2 && wget -qO - https://openresty.org/package/pubkey.gpg | apt-key add - \
    && apt-get -y install software-properties-common \
    && add-apt-repository -y "deb http://openresty.org/package/ubuntu $(lsb_release -sc) main"

RUN apt-get -qq update && apt-get -qqy install  zlib1g-dev libreadline-dev libncurses5-dev libpcre3-dev libssl-dev perl make curl git-core curl luarocks libsass-dev openresty

RUN luarocks install --server=http://rocks.moonscript.org/manifests/leafo lapis $LAPIS_VERSION
RUN luarocks install moonscript
RUN luarocks install lapis-console
RUN luarocks install stringy
RUN luarocks install busted
RUN luarocks install sass

WORKDIR /var/www

ENV LAPIS_OPENRESTY $OPENRESTY_PREFIX/nginx/sbin/nginx