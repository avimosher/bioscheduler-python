#!/usr/bin/python

from Bio import SeqIO

seq=SeqIO.parse(open('test.gb','r'),"genbank")
