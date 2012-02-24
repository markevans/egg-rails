require "egg-rails/version"
require 'egg-rails/view_helpers'

module Egg
  module Rails

    class Railtie < ::Rails::Railtie
      initializer "egg.view_helpers" do
        ActionView::Base.send :include, ViewHelpers
      end
    end

    class Engine < ::Rails::Engine
    end

  end
end
