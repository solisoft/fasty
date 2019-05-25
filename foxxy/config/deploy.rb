set :stages, %w(production staging)

require 'mina/multistage'
require 'mina/bundler'
require 'mina/rails'
require 'mina/git'
require 'YAML'

begin
  YAML.load(IO.read('config/local_env.yml'))[@stage].each do |key, value|
    ENV[key.to_s] = value
  end
rescue
  puts 'config/local_env.yml is missing.'
  exit
end


task :environment do
end

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
    find_and_replace = "ruby -pi -e \"gsub('http://localhost:8529/_db/#{ENV["ARANGODB_DBNAME"]}/', '#{ENV["ARANGODB_HTTP_ENDPOINT"]}')\" dist/*.html"
    queue "rm -Rf dist/*; yarn run brunch b -- --production;git add . ; #{find_and_replace}; git commit -am 'dist release'; git push"
  end
  deploy do
    invoke :'git:clone'
    invoke :'deploy:cleanup'
    to :launch do
      foxx_commands = []
      # Try to install
      foxx_commands << "foxx-manager install #{deploy_to}/#{current_path}/foxx/${i%/}.zip /${i%/} --server.endpoint #{ENV["ARANGODB_ENDPOINT"]} --server.database #{ENV["ARANGODB_DBNAME"]} --server.password #{ENV["ARANGODB_PASS"]} --server.username #{ENV["ARANGODB_USER"]}"
      # Uprade
      foxx_commands << "foxx-manager upgrade #{deploy_to}/#{current_path}/foxx/${i%/}.zip /${i%/} --server.endpoint #{ENV["ARANGODB_ENDPOINT"]} --server.database #{ENV["ARANGODB_DBNAME"]} --server.password #{ENV["ARANGODB_PASS"]} --server.username #{ENV["ARANGODB_USER"]}"
      # Run setup
      foxx_commands << "foxx-manager setup /${i%/} --server.database #{ENV["ARANGODB_DBNAME"]} --server.endpoint #{ENV["ARANGODB_ENDPOINT"]} --server.password #{ENV["ARANGODB_PASS"]} --server.username #{ENV["ARANGODB_USER"]}"
      queue "cd #{deploy_to}/#{current_path}/foxx && for i in */; do zip -r \"${i%/}.zip\" \"$i\"; #{foxx_commands.join("; ")};done"
      queue "cd #{deploy_to}/#{current_path}/foxx && rm *.zip"
    end
  end
end