module Egg
  class ViewGenerator < ::Rails::Generators::NamedBase
    source_root File.expand_path('../templates', __FILE__)

    argument :name, :type => :string

    def create_stuff
      template "view.coffee.erb", "app/assets/javascripts/shared/views/#{view_name}.coffee"
      template "presenter.coffee.erb", "app/assets/javascripts/shared/presenters/#{presenter_name}.coffee"
      template "template.mustache.erb", "app/assets/javascripts/shared/templates/#{underscore_name}.mustache"
      template "view.css.scss.erb", "app/assets/stylesheets/views/#{underscore_name}.css.scss"
      if apps.length == 1
        add_handler apps.first
      else
        apps.each do |app|
          add_handler(app) if yes?("Add a handler for app #{app.basename}?")
        end
      end
    end

    private
  
    def underscore_name
      name.underscore.sub(/_view$/, '')
    end

    def view_name
      "#{underscore_name}_view"
    end

    def presenter_name
      "#{underscore_name}_presenter"
    end

    def apps
      Pathname.glob(::Rails.root.join('app/assets/javascripts/apps/*'))
    end
  
    def add_handler(app)
      template "handler.coffee.erb", app.join("handlers/views/#{view_name}.coffee")
    end

  end
end
