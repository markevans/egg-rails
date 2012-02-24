module Egg
  class PresenterGenerator < ::Rails::Generators::NamedBase
    source_root File.expand_path('../templates', __FILE__)

    argument :name, :type => :string

    def create_stuff
      template "presenter.coffee.erb", "app/assets/javascripts/shared/presenters/#{presenter_name}.coffee"
    end

    private

    def presenter_name
      "#{name}".underscore
    end

  end
end
