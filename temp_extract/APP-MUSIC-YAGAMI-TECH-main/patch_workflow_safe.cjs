const fs = require('fs');
let code = fs.readFileSync('.github/workflows/main.yml', 'utf8');

const target = `            if !app_group.files.any? { |f| f.real_path.to_s == path }
              file_ref = app_group.new_reference(path)
              target.add_file_references([file_ref])
            end`;

const replacement = `            file_ref = app_group.new_reference(path)
            target.add_file_references([file_ref])`;

if (code.includes("f.real_path.to_s")) {
  code = code.replace(target, replacement);
  fs.writeFileSync('.github/workflows/main.yml', code);
  console.log("Patched main.yml to be safer!");
}
