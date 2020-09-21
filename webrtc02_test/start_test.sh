# start test sync server
node test_sync_server.js &
test_sync_server_pid=$!

# start nightwatch
npx nightwatch -e seleniumA,seleniumB

# terminate test sync server
kill $test_sync_server_pid
