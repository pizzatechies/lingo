# Adds the Lugha Zetu WidgetKit extension and the WidgetBridge plugin files to the Xcode project.
# Idempotent: safe to run again. Usage: ruby scripts/add-ios-widget.rb   (needs `gem install xcodeproj`)
require 'xcodeproj'

project_path = File.expand_path('../ios/App/App.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'App' } or abort 'App target not found'
app_group = project.main_group.find_subpath('App', false) or abort 'App group not found'

# App-side Swift files (plugin + view controller that registers it) and entitlements.
%w[WidgetBridgePlugin.swift MainViewController.swift].each do |name|
  ref = app_group.files.find { |f| f.path == name } || app_group.new_file(name)
  app.source_build_phase.add_file_reference(ref, true)
end
app_group.new_file('App.entitlements') unless app_group.files.any? { |f| f.path == 'App.entitlements' }
version = app.build_configurations.first.build_settings['MARKETING_VERSION']
build = app.build_configurations.first.build_settings['CURRENT_PROJECT_VERSION']
app.build_configurations.each { |c| c.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements' }

widget = project.targets.find { |t| t.name == 'LughaWidget' }
unless widget
  widget = project.new_target(:app_extension, 'LughaWidget', :ios, '16.0')
  group = project.main_group.new_group('LughaWidget', 'LughaWidget')
  widget.source_build_phase.add_file_reference(group.new_file('LughaWidget.swift'))
  group.new_file('Info.plist')
  group.new_file('LughaWidget.entitlements')
  widget.add_system_framework(%w[WidgetKit SwiftUI])

  embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
  embed.symbol_dst_subfolder_spec = :plug_ins
  embed.add_file_reference(widget.product_reference, true).settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  app.add_dependency(widget)
end

widget.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = 'ke.lugha.app.widget'
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'LughaWidget/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['CODE_SIGN_ENTITLEMENTS'] = 'LughaWidget/LughaWidget.entitlements'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
  s['SWIFT_VERSION'] = '5.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['SKIP_INSTALL'] = 'YES'
  s['MARKETING_VERSION'] = version
  s['CURRENT_PROJECT_VERSION'] = build
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
end

project.save
puts "Widget target ready (version #{version} build #{build})"
