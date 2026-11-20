import sys, cv2
# grid.py frame x0 y0 x1 y1 out [step]
f, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
step = int(sys.argv[7]) if len(sys.argv) > 7 else 50
im = cv2.imread(f)[y0:y1, x0:x1].copy()
for x in range((x0 // step + 1) * step, x1, step):
    cv2.line(im, (x - x0, 0), (x - x0, y1 - y0), (0, 255, 255) if x % (step * 2) == 0 else (0, 160, 160), 1)
    if x % (step * 2) == 0: cv2.putText(im, str(x), (x - x0 + 2, 14), 0, 0.42, (0, 255, 255), 1)
for y in range((y0 // step + 1) * step, y1, step):
    cv2.line(im, (0, y - y0), (x1 - x0, y - y0), (255, 0, 255) if y % (step * 2) == 0 else (160, 0, 160), 1)
    if y % (step * 2) == 0: cv2.putText(im, str(y), (2, y - y0 - 3), 0, 0.42, (255, 0, 255), 1)
cv2.imwrite(out, im)
