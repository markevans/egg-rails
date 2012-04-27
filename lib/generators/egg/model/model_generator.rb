module Egg
  class ModelGenerator < ::Rails::Generators::NamedBase
    source_root File.expand_path('../templates', __FILE__)

    argument :name, :type => :string

    def create_stuff
      template "model.coffee.erb", "app/assets/javascripts/models/#{model_name}.coffee"
      template "observer.coffee.erb", "app/assets/javascripts/observers/#{model_name}_observer.coffee"
    end

    private

    def model_name
      "#{name}".underscore
    end

  end
end
