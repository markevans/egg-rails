module Egg
  class ModelGenerator < ::Rails::Generators::NamedBase
    source_root File.expand_path('../templates', __FILE__)

    argument :name, :type => :string

    def create_stuff
      template "model.coffee.erb", "app/assets/javascripts/shared/models/#{model_name}.coffee"
      apps.each do |app|
        add_observer(app) if yes?("Add a observer for app #{app.basename}?")
      end
    end

    private

    def model_name
      "#{name}".underscore
    end
  
    def apps
      Pathname.glob(::Rails.root.join('app/assets/javascripts/apps/*'))
    end
  
    def add_observer(app)
      template "observer.coffee.erb", app.join("observers/models/#{model_name}.coffee")
    end

  end
end
