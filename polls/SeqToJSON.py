from Bio import AlignIO
from Bio import SeqIO
from Bio.Alphabet import single_letter_alphabet
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio.SeqIO.Interfaces import SequentialSequenceWriter
import json
import sys

def SeqFromJSON(handle, alphabet = single_letter_alphabet, title2ids=None ):
    jsonObj = json.loads( handle.read() )
    if hasattr(jsonObj,'update'):
        # then it's a dict, so we've only one record.
        jsonSeq = jsonObj.pop('seq', '')
        yield SeqRecord( Seq( jsonSeq , alphabet), **jsonObj )
    else:
        # more than one record
        for jsonRecord in jsonObj:
            jsonSeq = jsonRecord.pop('seq', '')
            yield SeqRecord( Seq( jsonSeq , alphabet), **jsonRecord )

class SeqToJSON(SequentialSequenceWriter):
    features = ['type', 'location_operator', 'strand', 'id',
                'ref', 'ref_db', 'qualifiers']
    def convert_features(self, features):
        """features - a list of SeqFeature objects"""
        def _convert_feature( feature ):
            _feature = {}
            if hasattr( feature, 'location' ):
                location = feature.location
                attrs = ('strand', 'start', 'end',)
                location = dict((attr, getattr(location,attr)) for attr in attrs \
                        if hasattr( location, attr ))
                _feature.update( { 'location' : location } )
            #if hasattr( feature, 'type' ):
            #    typeName = feature.type
            #    attrs = ('type')
            for feat in self.features:
                if hasattr( feature, feat ):
                    _feature.update( { feat : getattr(feature,feat) } )
            # recursively update subfeatures.
            if hasattr( feature, 'subfeatures' ):
                _feature.update( self.convert_features( \
                            getattr(feature, 'subfeatures' ) ) )
            return _feature

        return list(map( _convert_feature, features ))
    def write_header(self):
        self.handle.write('[')
        self._header_written = True
    def write_footer(self):
        self.handle.write(']')
        self._footer_written = True
    attributes = ['id', 'name', 'description', 'dbxrefs',
                        'annotations', 'letter_annotations' ]
    def write_record(self, record):
        write = self.handle.write
        if self._record_written:
            write(',')
        seq = record.seq
        jsonSeq = {'seq' : seq.tostring() }
        if hasattr( record, 'features' ):
            jsonSeq.update( {'features' : 
                self.convert_features(getattr(record, 'features')) } )
        for attr in self.attributes:
            if hasattr(record, attr):
                jsonSeq.update( { attr : getattr( record, attr )})
        # references come through in a weird format that dumps can't handle
        jsonSeq['annotations']['references']=[]
        ds=json.dumps(jsonSeq)
        write( ds )
        self._record_written = True
    def write_records(self, records):
        self.write_header()
        write_record = self.write_record
        list(map(write_record, records ))
        self.write_footer()
        return len(list(records))

SeqIO._FormatToIterator.update(   {'json': SeqFromJSON})
AlignIO._FormatToIterator.update( {'json': SeqFromJSON})
SeqIO._FormatToWriter.update(     {'json': SeqToJSON  })
AlignIO._FormatToWriter.update(   {'json': SeqToJSON  })

if __name__ == '__main__':
    import cStringIO as StringIO
    from Bio import SeqIO
    from Bio.SeqFeature import SeqFeature, FeatureLocation
    from Bio.Alphabet import generic_dna
    def testwrite():
        """Example of how to write sequences as a JSON
        string.
        """
        seq = SeqRecord( Seq( 'ACGTACGTACGTACGT',alphabet=generic_dna),
                    id = 'ABC123',
                    annotations = { 'species' : 'something or other' },
                    features = [
                        SeqFeature( location=FeatureLocation(start=0,end=3),
                            type='CDS',
                            id='a feature',
                            qualifiers = { 'a qual' : 'result' }
                        ),
                        SeqFeature( location=FeatureLocation(strand=-1,start=3,end=6),
                            type='CDS',
                            id='a feature',
                            qualifiers = { 'a qual' : 'result' }
                        )
                        ] )
        # StringIO used to replicate file-like object.
        #print 'Testing writing a SeqRecord object to json'
        json_seq = StringIO.StringIO()
        json_seq.write( seq.format('json' ) )
        #print 'genbank formatted sequence would look like:-'
        #print seq.format('genbank')
        json_seq.seek(0)
        #print 'json formatted version:-:'
        #print seq.format('json')
        return json_seq
    def testread():
        """ Example of how to read sequences from JSON object."""
        import re
        strip = re.compile('\s+')
        json_seqs = """\
            [{ 
                "id"   :  "ABC123",
                "name" : "nothing",
                "annotations" : { \
                        "source" : "species name"
                    },
                "seq"  : "ACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGT"
            },\
            { 
                "id"   :  "BCD234",
                "name" : "nothing",
                "annotations" : { \
                        "source" : "species name 2"
                    },
                "seq"  : "ACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGT"
            }]\
            """
        # strip white space from string and load it into file-like object
        seq_handle = StringIO.StringIO(strip.sub('',json_seqs))
        # convert to a list of SeqRecord objects
        seqs = [seq for seq in SeqIO.parse( seq_handle, 'json' ) ]
        return seqs
    seq_handle = testwrite()
    #print seq_handle.read()
    seqrecords = testread()
    print(seqrecords)
