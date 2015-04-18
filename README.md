## PROTOCOL

- filename, filesize, crc32, uploadtype
+ received
- <DATA>
+ received
- <DATA>
+ received
- <DATA>
+ received
- complete
+ received, crc32

## EXAMPLES

New upload

- test.csv, 100, <crc32>, new
+ 0
- <DATA>
+ 64000
- <DATA>
+ 128 000
- true
+ 128 000, <crc32>

Continue upload

- test.csv, 100, <crc32>, continue
+ 64000
- <DATA>
+ 128 000
- true
+ 128 000, <crc32>