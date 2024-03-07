# Let's create a Python script that formats the sys_id values from the CSV file into the JavaScript array format

# Start of the Python script
script = "var validSysIds = [\n"
# Iterate over each sys_id and add it to the script string in the correct format
for sys_id in sys_id_list:
    script += f'    "{sys_id}",\n'
script += "];"

# Due to the potential large size, let's write the output to a text file instead of printing it directly
script_path = '/mnt/data/formatted_sys_ids.js'
with open(script_path, 'w') as file:
    file.write(script)

script_path
