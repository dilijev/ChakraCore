BEGIN {
  FS = ";";
  previncode = -1;
}
length($1) == 4 {
  incode = strtonum("0x" $1);
  for (i = previncode + 1; i < incode; i++)
    map[i] = i;
  if ($3 == "Ll" && $15 != "")
  {
    map[incode] = strtonum("0x" $15);
    # non-7-bit-ASCII cannot map to 7-bit-ASCII
    if (incode > 127 && map[incode] <= 127)
      map[incode] = incode;
  }
  else
    map[incode] = incode;
  previncode = incode;
}
END {
  for (i = previncode + 1; i <= 0xffff; i++)
    map[i] = i;

  for (i = 0x0000; i <= 0xffff; i++)
    ninv[i] = 0;

  for (i = 0x0000; i <= 0xffff; i++)
  {
    if (map[i] != i)
      ninv[map[i]]++;
  }

  maxninv = 0;
  for (i = 0x0000; i <= 0xffff; i++)
  {
    if (ninv[i] > maxninv)
      maxninv = ninv[i];
  }
  if (maxninv > 2)
    print "ERROR";

  for (i = 0x0000; i <= 0xffff; i++)
    inv[i] = "";

  for (i = 0x0000; i <= 0xffff; i++)
  {
    if (map[i] != i)
      inv[map[i]] = sprintf("%s;0x%04x", inv[map[i]], i);
  }

  for (i = 0x0000; i <= 0xffff; i++)
  {
    if (map[i] != i)
    {
      equiv[i] = sprintf("0x%04x%s", map[i], inv[map[i]]);
      nequiv[i] = 1 + ninv[map[i]];
    }
    else if (inv[i] != "")
    {
      equiv[i] = sprintf("0x%04x%s", i, inv[i]);
      nequiv[i] = 1 + ninv[i];
    }
    else
    {
      equiv[i] = sprintf("0x%04x", i);
      nequiv[i] = 1;
    }
  }

  nentries = 0
  for (i = 0x0000; i <= 0xffff; i++)
  {
    if (nequiv[i] > 1)
    {
      printf("0x%04x;%s\n", i, equiv[i]);
      nentries++;
    }
  }
  #printf("nentries = %d\n", nentries);
}
