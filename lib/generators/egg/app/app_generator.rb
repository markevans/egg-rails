module Egg
  class AppGenerator < ::Rails::Generators::NamedBase
    source_root File.expand_path('../templates', __FILE__)

    argument :name, :type => :string

    def create_stuff
      jsdir = "app/assets/javascripts"
    
      template 'page.html.erb',      "app/views/#{ask('Enter the relative path for the html template (e.g. home/index):')}.html.erb"
      template "app.coffee.erb",     "#{jsdir}/apps/#{app_name}/index.coffee"
    
      ensure_directory_exists "#{jsdir}/apps/#{app_name}/handlers"
      ensure_directory_exists "#{jsdir}/shared/models"
      ensure_directory_exists "#{jsdir}/shared/views"
      ensure_directory_exists "#{jsdir}/shared/presenters"
      ensure_directory_exists "#{jsdir}/shared/templates"
    
      set_up_application_js
    end

    private

    def ensure_directory_exists(dir)
      unless File.exist?(dir)
        empty_directory(dir)
        create_file [dir, '.gitignore'].join('/') if project_uses_git?
      end
    end

    def underscore_name
      name.underscore.sub(/_app$/, '')
    end

    def app_name
      "#{underscore_name}_app"
    end

    def set_up_application_js
      app_js = ::Rails.root.join('app/assets/javascripts/application.js')
      pattern = /^\/\/= require_tree \.$/
      if app_js.exist? &&
        app_js.read[pattern] &&
        yes?(%(Remove "require_tree ." in application.js? (Recommended)))
        gsub_file app_js, pattern, ''
      end
    end

    def project_uses_git?
      ::Rails.root.join('.git').exist?
    end

  end
end
