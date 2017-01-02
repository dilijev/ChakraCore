BEGIN {
  FS = ";";
  lastCode = -1;
  currStart = -1;
  for (i = 0; i < 3; i++)
    currDeltas[i] = "";
}
{
  if (NF > 4)
    print "ERROR"

  incode = strtonum($1);
  for (i = 0; i < NF - 1; i++)
    equivs[i] = strtonum($(i+2));
  for (i = NF - 1; i < 3; i++)
    equivs[i] = equivs[i - 1];

  #printf("0x%04x, 0x%04x, 0x%04x, 0x%04x\n", incode, equivs[0], equivs[1], equivs[2]);

  for (i = 0; i < 3; i++)
    deltas[i] = equivs[i] - incode;

  if (currStart < 0)
  {
    # start a new range
    currStart = incode;
    for (i = 0; i < 3; i++)
      currDeltas[i] = deltas[i]
  }
  else if (incode == lastCode + 1 && deltas[0] == currDeltas[0] && deltas[1] == currDeltas[1] && deltas[2] == currDeltas[2])
  {
    # keep accumulating range
  }
  else
  {
    # dump current range and start a new one
    printf("            0x%04x, 0x%04x, %d, %d, %d,\n", currStart, lastCode, currDeltas[0], currDeltas[1], currDeltas[2]);
    currStart = incode;
    for (i = 0; i < 3; i++)
      currDeltas[i] = deltas[i]
  }

  lastCode = incode;
}
END {
  printf("            0x%04x, 0x%04x, %d, %d, %d,\n", currStart, lastCode, currDeltas[0], currDeltas[1], currDeltas[2]);
}
