I made these changes to the AWS instance when I created it.

sysctl vm.overcommit_memory=1

sudo bash -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled"

dd if=/dev/zero of=/swapfile1 bs=1024 count=4194304
