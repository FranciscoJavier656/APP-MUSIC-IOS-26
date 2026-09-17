const fs = require('fs');
let code = fs.readFileSync('.github/workflows/main.yml', 'utf8');

const target = `      - name: Build iOS App (No Code Signing & No Icon)`;

const replacement = `      - name: Inject Native Plugins into Xcode Project
        run: |
          gem install xcodeproj
          cat << 'RUBYEOF' > patch_xcode.rb
          require 'xcodeproj'
          project_path = 'ios/App/App.xcodeproj'
          project = Xcodeproj::Project.open(project_path)
          app_group = project.main_group.children.find { |group| group.name == 'App' || group.path == 'App' } || project.main_group
          
          files = [
            'ios/App/App/LiquidTabBarPlugin.swift',
            'ios/App/App/LiquidTabBarPlugin_Register.m',
            'ios/App/App/QobuzAudioPlugin_Register.m',
            'ios/App/App/YagamiDownloadManager_Register.m',
            'ios/App/App/YagamiDownloadManager.swift'
          ]
          
          target = project.targets.first
          
          files.each do |file|
            path = File.expand_path(file)
            # Only add if not already in project
            if !app_group.files.any? { |f| f.real_path.to_s == path }
              file_ref = app_group.new_reference(path)
              target.add_file_references([file_ref])
            end
          end
          project.save
          RUBYEOF
          ruby patch_xcode.rb

      - name: Build iOS App (No Code Signing & No Icon)`;

if (!code.includes("Inject Native Plugins into Xcode Project")) {
  code = code.replace(target, replacement);
  fs.writeFileSync('.github/workflows/main.yml', code);
  console.log("Patched main.yml!");
} else {
  console.log("Already patched.");
}
