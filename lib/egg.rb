require "egg/version"
require 'egg/view_helpers'

module Egg
  class Railtie < Rails::Railtie
    initializer "egg.view_helpers" do
      ActionView::Base.send :include, ViewHelpers
    end
  end
end

module Egg
  class Engine < Rails::Engine
  end
end
