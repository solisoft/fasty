set :stages, %w(production staging)

require 'mina/multistage'
require 'mina/bundler'
require 'mina/rails'
require 'mina/git'
require 'YAML'

task :environment do
end
# set :shared_paths, ['config.moon']

# Put any custom mkdir's in here for when `mina setup` is ran.
# For Rails apps, we'll make some of the shared paths that are shared between
# all releases.
task :setup => :environment do
  queue! %[mkdir -p "#{deploy_to}/#{shared_path}/log"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/#{shared_path}/log"]

  queue! %[mkdir -p "#{deploy_to}/#{shared_path}/config"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/#{shared_path}/config"]

  queue! %[mkdir -p "#{deploy_to}/#{shared_path}/uploads"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/#{shared_path}/uploads"]

  if repository
    repo_host = repository.split(%r{@|://}).last.split(%r{:|\/}).first
    repo_port = /:([0-9]+)/.match(repository) && /:([0-9]+)/.match(repository)[1] || '22'

    queue %[
      if ! ssh-keygen -H  -F #{repo_host} &>/dev/null; then
        ssh-keyscan -t rsa -p #{repo_port} -H #{repo_host} >> ~/.ssh/known_hosts
      fi
    ]
  end
end

desc "Deploys the current version to the server."
task :deploy => :environment do
  to :before_hook do
    # Put things to run locally before ssh
    find_and_replace = "ruby -pi -e \"gsub('http://localhost:8529/_db/cms/', 'http://cluster.solicms.com:8529/_db/cms/')\" dist/*.html"
    queue "cd foxxy; rm -Rf dist/*; yarn run brunch b -- --production;git add . ; #{find_and_replace}; cd ..; git commit -am 'dist release'; git push;"
  end
  deploy do
    invoke :'git:clone'
    # invoke :'deploy:link_shared_paths'
    invoke :'deploy:cleanup'
    to :launch do
    end
  end
end